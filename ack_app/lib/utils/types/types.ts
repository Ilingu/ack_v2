import { ReactNode } from "react";
import type {
  JikanApiResAnime,
  JikanApiResEpisodes,
  JikanApiResRecommandations,
} from "./interface";

export type PropsChildren = ReactNode | ReactNode[];

export type ConnMethods = "google" | "twitter" | "github";

export type AnimeType = "TV" | "OVA" | "Movie" | "Special" | "ONA" | "Music";
export type AnimeStatusType =
  | "airing"
  | "completed"
  | "to_be_aired"
  | "upcoming"
  | "Not yet aired"
  | "Finished Airing";
export type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g";
export type NetworkType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "none"
  | "wifi"
  | "wimax"
  | "other"
  | "unknown";
export type TheFourSeason = "winter" | "spring" | "summer" | "fall";
export type DayOfWeek =
  | "mondays"
  | "tuesdays"
  | "wednesdays"
  | "thursdays"
  | "fridays"
  | "saturdays"
  | "sundays";
export type DateOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AnimeDatasShape = [
  JikanApiResAnime,
  JikanApiResEpisodes[],
  JikanApiResRecommandations[],
  string
];

export type ProviderUIInfo = [string, string];

export type tRPCError =
  | "PARSE_ERROR"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_SUPPORTED"
  | "TIMEOUT"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "CLIENT_CLOSED_REQUEST";
