import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "@firebase/auth";
import { doc, onSnapshot } from "@firebase/firestore";
import { UserShape } from "./types/interface";

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
