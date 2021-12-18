import { useEffect, useState } from "react";
// Auth
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "@firebase/auth";
import { doc, onSnapshot, collection } from "@firebase/firestore";
// Types
import { AnimeShape, UserShape } from "./types/interface";
// Func
import { postToJSON } from "./utilityfunc";

export function useUserData() {
  const [user, setUser] = useState<User>(null);
  const [usernameState, setUsername] = useState<string>(null);
  const [reqFinished, setFinished] = useState(false);

  useEffect(() => {
    let unsubscribe;

    onAuthStateChanged(auth, async (user: User) => {
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
        setFinished(true);
      }
    });

    return unsubscribe;
  }, []);

  return { user, username: usernameState, reqFinished };
}

export function useGlobalAnimeData() {
  const [GlobalAnimeData, setGlobalAnime] = useState<AnimeShape[]>();

  useEffect(() => {
    let unsub = onSnapshot(collection(db, "animes"), (Snapdocs) => {
      const GlobalAnime = (Snapdocs?.docs
        ?.map(postToJSON)
        .filter((dt) => !dt.AllAnimeId) || []) as AnimeShape[];
      setGlobalAnime(GlobalAnime);
    });

    return unsub;
  }, []);

  return { GlobalAnimeData };
}
