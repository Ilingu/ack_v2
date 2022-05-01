import { useEffect, useRef, useState } from "react";
// Auth
import { auth, db } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe, User } from "@firebase/auth";
import { doc, onSnapshot, collection } from "@firebase/firestore";
// Types
import type {
  AnimeShape,
  IDBShape,
  UserAnimeShape,
  UserGroupShape,
  UserShape,
} from "./utils/types/interface";
// Func
import {
  encryptDatas,
  filterUserAnime,
  GetAnimesDatasByIds,
  postToJSON,
  SpotDifferenciesBetweenArrays,
} from "./utils/UtilsFunc";
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
      ? Date.now() + 259200000
      : (await GetIDBAnimes())[0]?.expire || Date.now(), // 3J --> Force Refresh for AnimesDatas Updates
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
        )}; expires=${new Date(Date.now() + 153360000000).toISOString()}`; // 153360000000 = 5y = Session Cookie

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
      const filteredUserAnime = filterUserAnime(UserAnimes);

      // Missing Animes In IDB
      const MissingDependencies = SpotDifferenciesBetweenArrays(
        filteredUserAnime,
        GlobalAnimesDatas,
        "AnimeId",
        "malId"
      ) as number[];
      let MissingAnimesDatas: AnimeShape[] = [];

      if (MissingDependencies.length > 0)
        MissingAnimesDatas = await CallFB(MissingDependencies);

      // Animes in IDB but not in UserAnimes
      const OverflowDependencies = SpotDifferenciesBetweenArrays(
        GlobalAnimesDatas,
        filteredUserAnime,
        "malId",
        "AnimeId"
      );
      let GlobalAnimesWithoutOverflow: AnimeShape[] = [];

      if (OverflowDependencies.length > 0)
        GlobalAnimesWithoutOverflow = [...GlobalAnimesDatas].filter(
          ({ malId }) => !OverflowDependencies.includes(malId)
        );

      // Merge
      if (
        MissingAnimesDatas.length > 0 ||
        GlobalAnimesWithoutOverflow.length > 0
      ) {
        const WithOverflow = GlobalAnimesWithoutOverflow.length > 0;

        const NewDatasToRender = [
          ...(WithOverflow
            ? GlobalAnimesWithoutOverflow
            : GlobalAnimesDatas || []),
          ...(MissingAnimesDatas || []),
        ];

        RenderAnimes(NewDatasToRender, { save: true, Expire: false });
      }
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
