import { useCallback, useEffect, useRef, useState } from "react";
// Auth
import { auth, db } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe, User } from "@firebase/auth";
import { doc, onSnapshot, collection, getDoc } from "@firebase/firestore";
// Types
import {
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
  postToJSON,
  SpotDifferenciesBetweenArrays,
} from "./utils/UtilsFunc";
import { ClearIDB, GetIDBAnimes, WriteIDB } from "./utils/IDB";

const CacheDatasToIDB = async (NewGlobalAnimesDatas: AnimeShape[]) => {
  const IDBObject: IDBShape = {
    AnimesStored: NewGlobalAnimesDatas,
    expire: Date.now() + 259200000, // 3J --> Force Refresh for AnimesDatas Updates (Like Season)
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
      unsubscribe();
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

  const ResetDatas = () => {
    setUserAnimesData(undefined);
    setGlobalAnimes(undefined);
  };

  const GetAnimesDatasByIds = async (AnimesIds: number[]) => {
    if (GlobalAnimesFecthFB.current >= 50)
      return console.warn("Fetch Quotas Exceeded For This Session: Reload");

    const QAnimesDocs = await Promise.all(
      AnimesIds.map(async (AnimeId) => {
        const QAnimeRef = doc(db, "animes", AnimeId.toString());
        return await getDoc(QAnimeRef);
      })
    );

    const AnimesDatas = QAnimesDocs.map(postToJSON) as AnimeShape[];
    const NewGlobalAnimesDatas = [...(GlobalAnimesDatas || []), ...AnimesDatas];

    setGlobalAnimes(NewGlobalAnimesDatas);
    await CacheDatasToIDB(NewGlobalAnimesDatas);

    GlobalAnimesFecthFB.current++;
  };

  const SyncCacheDatas = async (UserAnimes: UserAnimeShape[]) => {
    if (!GlobalAnimesDatas) return;
    const filteredUserAnime = [...UserAnimes];

    const CacheMissingAnime =
      filteredUserAnime.length > GlobalAnimesDatas.length;

    if (CacheMissingAnime) {
      const MissingDependencies = SpotDifferenciesBetweenArrays(
        filteredUserAnime,
        GlobalAnimesDatas,
        "AnimeId",
        "malId"
      ) as number[];

      return await GetAnimesDatasByIds(MissingDependencies);
    }

    const CacheNotSync = filteredUserAnime.length < GlobalAnimesDatas.length;
    if (CacheNotSync) {
      const OverflowDependencies = SpotDifferenciesBetweenArrays(
        GlobalAnimesDatas,
        filteredUserAnime,
        "malId",
        "AnimeId"
      );
      const NewGlobalAnimesDatas = [...GlobalAnimesDatas].filter(
        ({ malId }) => !OverflowDependencies.includes(malId)
      );

      setGlobalAnimes(NewGlobalAnimesDatas);
    }
  };

  const GetAnimesDatas = async () => {
    const CachedAnimesDatas = await GetIDBAnimes();

    if (!CachedAnimesDatas || CachedAnimesDatas.length <= 0)
      return GetAnimesDatasByIds(
        filterUserAnime(UserAnimesData).map(({ AnimeId }) => AnimeId)
      );

    if (
      CachedAnimesDatas[0]?.expire < Date.now() ||
      !CachedAnimesDatas[0]?.AnimesStored ||
      CachedAnimesDatas[0]?.AnimesStored.length <= 0
    )
      return GetAnimesDatasByIds(
        filterUserAnime(UserAnimesData).map(({ AnimeId }) => AnimeId)
      );

    const GlobalUserAnimeDatas = CachedAnimesDatas[0].AnimesStored;
    setGlobalAnimes(GlobalUserAnimeDatas);
  };

  useEffect(() => {
    if (!UserAnimesData || GlobalAnimesDatas) return null;
    GetAnimesDatas(); // Get User Animes Datas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnimesDatas, UserAnimesData]);

  useEffect(() => {
    if (!userUid) return ResetDatas();

    const UserAnimesRef = collection(doc(db, "users", userUid), "animes");
    let unsub = onSnapshot(UserAnimesRef, (Snapdocs) => {
      const UserAnimes =
        (Snapdocs?.docs?.map(postToJSON) as UserAnimeShape[]) || [];
      setUserAnimesData(UserAnimes);

      const filteredUserAnime = filterUserAnime(UserAnimes);
      if (filteredUserAnime?.length === 0) return;
      SyncCacheDatas(filteredUserAnime);
    });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid]);

  useEffect(() => {
    if (!userUid) return null;

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
