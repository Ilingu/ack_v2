import { ReactNode } from "react";

export type PropsChildren = ReactNode | ReactNode[];

export type ConnMethods = "google" | "twitter" | "github";

export type AnimeType = "TV" | "OVA" | "Movie" | "Special" | "ONA" | "Music";
export type AnimeStatusType =
  | "airing"
  | "completed"
  | "to_be_aired"
  | "upcoming";
export type SeeAnimeInfoFunc = (mal_id: number) => void;
