import { ReactNode } from "react";

export type PropsChildren = ReactNode | ReactNode[];

export type ConnMethods = "google" | "twitter" | "github";

export type AnimeType = "tv" | "ova" | "movie" | "special" | "ona" | "music";
export type AnimeStatusType =
  | "airing"
  | "completed"
  | "to_be_aired"
  | "upcoming";
