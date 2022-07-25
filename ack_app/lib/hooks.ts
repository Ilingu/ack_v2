import { useEffect, useRef, useState } from "react";
// Auth
import { auth, db } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe, User } from "@firebase/auth";
import { doc, onSnapshot, collection } from "@firebase/firestore";
// Types
import type {
  AnimeShape,
  DifferenceWWShapeReq,
  FunctionJob,
  IDBShape,
  UserAnimeShape,
  UserGroupShape,
  UserShape,
  WebWorkerRequest,
} from "./utils/types/interface";
// Func
import { filterUserAnime, postToJSON, encryptDatas } from "./utils/UtilsFuncs";
import { GetAnimesDatasByIds, ThrowInAppError } from "./client/ClientFuncs";
import { ClearIDB, GetIDBAnimes, WriteIDB } from "./utils/IDB";

interface SaveShape {
  save: boolean;
  Expire?: boolean;
}

const CacheDatasToIDB = async (
  NewGlobalAnimesDatas: AnimeShape[],
  NewExpire: boolean
) => {
  const IDBObject: IDBShape = {
    AnimesStored: NewGlobalAnimesDatas,
    expire: NewExpire
      ? Date.now() + 172800000 // 2J --> Force Refresh for AnimesDatas Updates
      : (await GetIDBAnimes())[0]?.expire || Date.now(),
  };
  await WriteIDB(IDBObject);
};

/* FB */
export function useUserData() {
  const [user, setUser] = useState<User>(null);
  const [usernameState, setUsername] = useState<string>(null);
  const [reqFinished, setFinished] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe;

    document.cookie = "UsT=; expires=Thu, 01 Jan 1970 00:00:00 UTC"; // 🍪
    const unSub = onAuthStateChanged(auth, async (user: User) => {
      if (user) {
        const UserRef = doc(db, "users", user.uid);
        unsubscribe = onSnapshot(UserRef, (doc) => {
          if (doc.exists()) {
            const { username } = doc.data() as UserShape;
            username && setUsername(username);
            username || setUsername(null);
          } else {
            setUsername(null);
          }
          setFinished(true);
        });

        // 🍪
        const token = await user.getIdToken();
        const encryptedCookie = encryptDatas(Buffer.from(token));
        document.cookie = `UsT=${encryptedCookie.toString(
          "base64"
        )}; expires=${new Date(Date.now() * 36000).toUTCString()}`; // 153360000000 = 5y = Session Cookie

        setUser(user); // Settings User
      } else {
        setUser(null);
        setUsername(null);
        setFinished(true);

        // Clear Cached Datas
        await ClearIDB();
        document.cookie = "UsT=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
      }
    });

    return () => {
      unsubscribe && unsubscribe();
      unSub();
    };
  }, []);

  return { user, username: usernameState, reqFinished };
}

export function useGlobalAnimeData(userUid: string) {
  const [GlobalAnimesDatas, setGlobalAnimes] = useState<AnimeShape[]>();
  const [UserAnimesData, setUserAnimesData] = useState<UserAnimeShape[]>();
  const [UserGroupsData, setUserGroupsData] = useState<UserGroupShape[]>();
  const GlobalAnimesFecthFB = useRef(0);
  const NewRenderOfEffect = useRef(true);

  const ResetDatas = () => {
    setUserAnimesData(undefined);
    setGlobalAnimes(undefined);
  };

  const RenderAnimes = (
    DatasToRender: AnimeShape[],
    { save, Expire }: SaveShape
  ) => {
    setGlobalAnimes(DatasToRender);
    if (save) CacheDatasToIDB(DatasToRender, Expire);
  };

  const CallFB = async (DependenciesArray: number[]) => {
    if (GlobalAnimesFecthFB.current >= 10000)
      return console.warn(
        "Fetch Quotas Exceeded For This Session: Reload"
      ) as unknown as AnimeShape[];
    GlobalAnimesFecthFB.current += DependenciesArray.length;

    return await GetAnimesDatasByIds(DependenciesArray);
  };

  const GetAnimesDatas = async () => {
    const CachedAnimesDatas = await GetIDBAnimes();
    const CacheExpired = async () => {
      RenderAnimes(
        await CallFB(
          filterUserAnime(UserAnimesData).map(({ AnimeId }) => AnimeId)
        ),
        { save: true, Expire: true }
      );
    };

    if (
      !CachedAnimesDatas ||
      CachedAnimesDatas.length <= 0 ||
      !CachedAnimesDatas[0]?.AnimesStored ||
      CachedAnimesDatas[0]?.AnimesStored.length <= 0
    )
      return await CacheExpired();

    if (CachedAnimesDatas[0]?.expire < Date.now()) CacheExpired(); // Expire --> Refetch in BG but display old version

    const GlobalUserAnimeDatas = CachedAnimesDatas[0].AnimesStored;
    return RenderAnimes(GlobalUserAnimeDatas, { save: false });
  };

  useEffect(() => {
    if (!UserAnimesData || GlobalAnimesDatas) return;
    GetAnimesDatas(); // Get User Animes Datas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnimesDatas, UserAnimesData]);

  useEffect(() => {
    if (!userUid) return ResetDatas;
    NewRenderOfEffect.current = true;

    const UserAnimesRef = collection(doc(db, "users", userUid), "animes");
    let unsub = onSnapshot(UserAnimesRef, async (Snapdocs) => {
      const UserAnimes =
        (Snapdocs?.docs?.map(postToJSON) as UserAnimeShape[]) || [];
      setUserAnimesData(UserAnimes);

      if (NewRenderOfEffect.current && UserAnimes.length <= 1) {
        NewRenderOfEffect.current = false;
        return;
      }

      /* SyncCacheDatas */
      if (!GlobalAnimesDatas) return;
      if (!window?.Worker) return ThrowInAppError();

      const DiffWebWorker = new Worker(
        new URL("./workers/difference.worker", import.meta.url)
      );

      const Payload: WebWorkerRequest<DifferenceWWShapeReq> = {
        data: { CachedValues: GlobalAnimesDatas, NewValues: UserAnimes },
      };
      DiffWebWorker.postMessage(Payload);
      DiffWebWorker.onmessage = (
        e: MessageEvent<FunctionJob<AnimeShape[]>>
      ) => {
        const { success, data: NewDatasToRender } = e.data;
        if (!success) return;

        if (NewDatasToRender)
          RenderAnimes(NewDatasToRender, {
            save: true,
            Expire: false,
          });
        DiffWebWorker.terminate();
      };
    });

    return unsub;
  }, [GlobalAnimesDatas, userUid]);

  useEffect(() => {
    if (!userUid) return () => undefined;

    const UserGroupsRef = collection(doc(db, "users", userUid), "groups");
    let unsub = onSnapshot(UserGroupsRef, (Snapdocs) => {
      const UserGroups = (Snapdocs?.docs?.map(postToJSON) ||
        []) as UserGroupShape[];
      setUserGroupsData(UserGroups);
    });

    return unsub;
  }, [userUid]);

  return {
    GlobalAnimesDatas,
    UserAnimesData,
    UserGroupsData,
  };
}
