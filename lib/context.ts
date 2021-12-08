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
interface EpsSearchCtx {
  photoLink: string;
}

/* Context */
export const UserContext = createContext<UserCtx>({
  user: null,
  username: null,
  reqFinished: false,
});

export const SearchPosterContext = createContext<ScPosterCtx>({
  reqTitle: "",
  SeeAnimeInfo: () => {},
});

export const EpisodesSearchContext = createContext<EpsSearchCtx>({
  photoLink: "",
});
