import { createContext } from "react";
import { User } from "@firebase/auth";

interface GlobalAppContext {
  user: User;
  username: string;
  reqFinished: boolean;
  IsWebVersion: boolean;
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
  IsWebVersion: false,
});

export const SearchPosterContext = createContext<ScPosterCtx>({
  reqTitle: "",
});

export const EpisodesSearchContext = createContext<EpsSearchCtx>({
  photoLink: "",
});
