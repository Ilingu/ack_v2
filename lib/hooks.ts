import { useCallback, useEffect, useRef, useState } from "react";
// Auth
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe, User } from "@firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  getDoc,
  DocumentChange,
  DocumentData,
} from "@firebase/firestore";
// Types
import {
  AnimeShape,
  IDBShape,
  UserAnimeShape,
  UserGroupShape,
  UserShape,
} from "./utils/types/interface";
// Func
import { encryptCookie, postToJSON } from "./utils/UtilsFunc";
import { ClearIDB, GetIDBAnimes, WriteIDB } from "./utils/IDB";

export function useUserData() {
  const [user, setUser] = useState<User>(null);
  const [usernameState, setUsername] = useState<string>(null);
  const [reqFinished, setFinished] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe;

    document.cookie = "UsT=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // 🍪
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
        const encryptedCookie = encryptCookie(Buffer.from(token));
        document.cookie = `UsT=${encryptedCookie.toString(
          "base64"
        )}; expires=${new Date(
          Date.now() + 1000 * 60 * 60 * 24
        ).toUTCString()}`;

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
  const [GlobalAnimeData, setGlobalAnime] = useState<AnimeShape[]>();
  const [UserAnimesData, setUserAnimesData] = useState<UserAnimeShape[]>();
  const [UserGroupsData, setUserGroupsData] = useState<UserGroupShape[]>();
  const GlobalAnimeFecthFB = useRef(0);

  const GetAnimesDatasFB = useCallback(
    async (UserAnimesDataCustom?: UserAnimeShape[]) => {
      if (
        GlobalAnimeFecthFB.current >= 50 ||
        (!UserAnimesData && !UserAnimesDataCustom)
      )
        return;

      const GlobalUserAnimeDocs = await Promise.all(
        (UserAnimesDataCustom || UserAnimesData).map(async ({ AnimeId }) => {
          const QueryRef = doc(db, "animes", AnimeId.toString());
          return await getDoc(QueryRef);
        })
      );
      const GlobalUserAnimeDatas = GlobalUserAnimeDocs.map(
        postToJSON
      ) as AnimeShape[];

      // Save
      setGlobalAnime(GlobalUserAnimeDatas);

      const IDBObject: IDBShape = {
        AnimesStored: GlobalUserAnimeDatas,
        expire: Date.now() + 54000000, // 15H
      };
      WriteIDB(IDBObject);

      GlobalAnimeFecthFB.current++;
    },
    [UserAnimesData]
  );

  const GetAnimesDatas = useCallback(async () => {
    const CachedAnimesDatas = await GetIDBAnimes();

    if (!CachedAnimesDatas || CachedAnimesDatas.length <= 0)
      return GetAnimesDatasFB(); // FB query

    if (
      CachedAnimesDatas[0]?.expire < Date.now() ||
      !CachedAnimesDatas[0]?.AnimesStored ||
      CachedAnimesDatas[0]?.AnimesStored.length <= 0
    )
      return GetAnimesDatasFB(); // FB query

    const GlobalUserAnimeDatas = CachedAnimesDatas[0].AnimesStored;
    setGlobalAnime(GlobalUserAnimeDatas);
  }, [GetAnimesDatasFB]);

  useEffect(() => {
    if (!UserAnimesData || GlobalAnimeData || GlobalAnimeFecthFB.current >= 50)
      return null;
    // Get User Animes Datas
    GetAnimesDatas();
  }, [GetAnimesDatas, GlobalAnimeData, UserAnimesData]);

  useEffect(() => {
    if (!userUid) {
      setUserAnimesData(undefined);
      setGlobalAnime(undefined);
      return null;
    }

    const UserAnimesRef = collection(doc(db, "users", userUid), "animes");
    let unsub = onSnapshot(UserAnimesRef, (Snapdocs) => {
      const UserAnimes = (Snapdocs?.docs?.map(postToJSON) ||
        []) as UserAnimeShape[];
      setUserAnimesData(UserAnimes);

      const ChangedDatas = Snapdocs.docChanges();
      if (ChangedDatas && ChangedDatas.length === 1) {
        const ChangedData = ChangedDatas[0];
        if (ChangedData.type === "added") {
          const IsAnimeDataNotCached = GlobalAnimeData.find(
            ({ malId }) =>
              malId === (ChangedData?.doc?.data() as UserAnimeShape).AnimeId
          );
          if (Object.keys(IsAnimeDataNotCached || {})?.length > 0) return;

          GetAnimesDatasFB(UserAnimes); // FB query
        }
      }
    });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid]);

  useEffect(() => {
    if (!userUid) {
      setUserGroupsData(undefined);
      return null;
    }

    const UserGroupsRef = collection(doc(db, "users", userUid), "groups");
    let unsub = onSnapshot(UserGroupsRef, (Snapdocs) => {
      const UserGroups = (Snapdocs?.docs?.map(postToJSON) ||
        []) as UserGroupShape[];
      setUserGroupsData(UserGroups);
    });

    return unsub;
  }, [userUid]);

  return {
    GlobalAnimeData,
    UserAnimesData,
    UserGroupsData,
  };
}
