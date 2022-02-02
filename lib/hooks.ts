import { useEffect, useState } from "react";
// Auth
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Unsubscribe, User } from "@firebase/auth";
import { doc, onSnapshot, collection } from "@firebase/firestore";
// Types
import {
  AnimeShape,
  UserAnimeShape,
  UserGroupShape,
  UserShape,
} from "./utils/types/interface";
// Func
import { postToJSON } from "./utils/UtilsFunc";

export function useUserData() {
  const [user, setUser] = useState<User>(null);
  const [usernameState, setUsername] = useState<string>(null);
  const [reqFinished, setFinished] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe;

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

        setUser(user);
      } else {
        setUser(null);
        setUsername(null);
        setFinished(true);
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

  useEffect(() => {
    let unsub = onSnapshot(collection(db, "animes"), (Snapdocs) => {
      const GlobalAnime = (Snapdocs?.docs
        ?.map(postToJSON)
        .filter((dt) => !dt.AllAnimeId) || []) as AnimeShape[];
      setGlobalAnime(GlobalAnime);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!userUid) {
      setUserAnimesData(undefined);
      return null;
    }

    const UserAnimesRef = collection(doc(db, "users", userUid), "animes");
    let unsub = onSnapshot(UserAnimesRef, (Snapdocs) => {
      const UserAnimes = (Snapdocs?.docs?.map(postToJSON) ||
        []) as UserAnimeShape[];

      setUserAnimesData(UserAnimes);
    });

    return unsub;
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

  return { GlobalAnimeData, UserAnimesData, UserGroupsData };
}
