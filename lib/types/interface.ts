import { AnimeStatusType, AnimeType } from "./types";

export interface UserShape {
  displayName: string;
  photoURL: string;
  username: string;
}
export interface AnimeContentShape {
  Episodes?: EpisodesShape;
  Duration: number;
}
export interface AnimeShape {
  title: string;
  AlternativeTitle: AlternativeTitleShape;
  photoPath: string;
  OverallScore: number;
  ScoredBy: number;
  content: AnimeContentShape;
  Airing: boolean;
  Status: AnimeStatusType;
  ReleaseDate: string;
  AgeRating: string;
  Synopsis: string;
  trailer_url: string;
  MoreInformation: string;
  type: AnimeType;
  Studios: StudiosShape[];
  Genre: GenreShape[];
  Theme: GenreShape[];
  nbEp: number;
}
export interface EpisodesShape {}
export interface StudiosShape {
  name: string;
}
export interface GenreShape {
  name: string;
}
export interface AlternativeTitleShape {
  title_english: string;
  title_japanese: string;
  title_synonyms: string[];
}
