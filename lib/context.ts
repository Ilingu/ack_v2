import { User } from "@firebase/auth";
import { createContext } from "react";

interface UserCtx {
  user: User;
  username: string;
}

export const UserContext = createContext<UserCtx>({
  user: null,
  username: null,
});
