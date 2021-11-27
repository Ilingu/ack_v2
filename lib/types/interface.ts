import { AnimeStatusType, AnimeType } from "./types";

export interface UserShape {
  displayName: string;
  photoURL: string;
  username: string;
}
/* Poster Data */
export interface PosterSearchData {
  title: string;
  photoPath: string;
  OverallScore: number;
  type: AnimeType;
}
/* AnimeDB */
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
export interface AnimeContentShape {
  Episodes?: EpisodesShape;
  Duration: number;
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

/* JikanRes on /search */
export interface JikanApiResSearch {
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
  results: JikanApiResSearchAnime[];
  last_page: number;
}
export interface JikanApiResSearchAnime {
  mal_id: number;
  url: string;
  image_url: string;
  title: string;
  airing: boolean;
  synopsis: string;
  type: AnimeType;
  episodes: number;
  score: number;
  start_date?: Date | string;
  end_date?: Date | string;
  members: number;
  rated: string;
}

/* JikanRes on /anime */
//#region
export interface JikanApiResAnime {
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
  mal_id: number;
  url: string;
  image_url: string;
  trailer_url: string;
  title: string;
  title_english: string;
  title_japanese: string;
  title_synonyms: string[];
  type: string;
  source: string;
  episodes: number;
  status: string;
  airing: boolean;
  aired: Aired;
  duration: string;
  rating: string;
  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string;
  background?: any;
  premiered: string;
  broadcast: string;
  related: Related;
  producers: Producer[];
  licensors: Licensor[];
  studios: Studio[];
  genres: Genre[];
  explicit_genres: any[];
  demographics: Demographic[];
  themes: Theme[];
  opening_themes: string[];
  ending_themes: string[];
  external_links: ExternalLink[];
}

export interface From {
  day: number;
  month: number;
  year: number;
}

export interface To {
  day: number;
  month: number;
  year: number;
}

export interface Prop {
  from: From;
  to: To;
}

export interface Aired {
  from: Date;
  to: Date;
  prop: Prop;
  string: string;
}

export interface Adaptation {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Prequel {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface SideStory {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface SpinOff {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Other {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Sequel {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Related {
  Adaptation: Adaptation[];
  Prequel: Prequel[];
  Sidestory: SideStory[];
  Spinoff: SpinOff[];
  Other: Other[];
  Sequel: Sequel[];
}

export interface Producer {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Licensor {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Studio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Genre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Demographic {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Theme {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface ExternalLink {
  name: string;
  url: string;
}
//#endregion
