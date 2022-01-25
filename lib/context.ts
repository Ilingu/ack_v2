import { createContext } from "react";
import { User } from "@firebase/auth";
import { AnimeShape, UserAnimeShape, UserGroupShape } from "./types/interface";

interface GlobalAppContext {
  user: User;
  username: string;
  reqFinished: boolean;
  // IsWebVersion: boolean;
  UserAnimes: UserAnimeShape[]; // Interface User anime
  GlobalAnime: AnimeShape[];
  UserGroups: UserGroupShape[];
}
interface ScPosterCtx {
  reqTitle: string;
}
interface EpsSearchCtx {
  photoLink: string;
}

/* Context */
export const GlobalAppContext = createContext<GlobalAppContext>({
  user: null,
  username: null,
  reqFinished: false,
  UserAnimes: [],
  GlobalAnime: [],
  // IsWebVersion: false,
  UserGroups: [],
});

export const SearchPosterContext = createContext<ScPosterCtx>({
  reqTitle: "",
});

export const EpisodesSearchContext = createContext<EpsSearchCtx>({
  photoLink: "",
});
