import { createContext } from "react";
import { User } from "@firebase/auth";
import { SeeAnimeInfoFunc } from "./types/types";

interface UserCtx {
  user: User;
  username: string;
  reqFinished: boolean;
}
interface ScPosterCtx {
  reqTitle: string;
  SeeAnimeInfo: SeeAnimeInfoFunc;
}

/* Context */
export const UserContext = createContext<UserCtx>({
  user: null,
  username: null,
  reqFinished: false,
});

export const SearchPosterContext = createContext<ScPosterCtx>({
  reqTitle: "",
  SeeAnimeInfo: Function,
});
