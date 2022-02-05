import { ReactNode } from "react";

export type PropsChildren = ReactNode | ReactNode[];

export type ConnMethods = "google" | "twitter" | "github";

export type AnimeType = "TV" | "OVA" | "Movie" | "Special" | "ONA" | "Music";
export type AnimeStatusType =
  | "airing"
  | "completed"
  | "to_be_aired"
  | "upcoming"
  | "Not yet aired";
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