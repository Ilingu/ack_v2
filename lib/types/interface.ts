import { ChangeEvent } from "react";
import { AnimeWatchType } from "./enums";
import {
  AnimeStatusType,
  AnimeType,
  NetworkEffectiveType,
  NetworkType,
} from "./types";

// Others
export interface AnimeConfigPathsIdShape {
  AllAnimeId: string[];
}
export interface NetworkInformationShape {
  downlink: number;
  effectiveType: NetworkEffectiveType;
  onchange?: (e: Event) => void;
  rtt: number;
  saveData: boolean;
  type: NetworkType;
}
/* User */
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
  malId: number;
}
/* EpisodesShapes */
export interface EpisodesShape {
  epsId: number;
  title: string;
  Filler: boolean;
  Recap: boolean;
  EpsURL: string;
  ForumURL: string;
}
/* RecommendationsShape */
export interface RecommendationsShape {
  malId: number;
  photoUrl: string;
  title: string;
  recommendationCount: number;
}
/* SeasonAnimesShape */
export interface SeasonAnimesShape {
  title: string;
  PhotoUrl: string;
  score: number;
  type: AnimeType;
  r18: boolean;
  BeginAiring: string;
  MalId: number;
}
/* User Anime */
export interface UserAnimeShape {
  AnimeId: number;
  WatchType: AnimeWatchType;
  Fav: boolean;
}
export interface UserGroupShape {
  GroupAnimesId: string[];
  GroupName: string;
}
export interface UserAnimePosterShape {
  AnimeId: number;
  WatchType: AnimeWatchType;
  Fav: boolean;
  title: string;
  photoURL: string;
  type: AnimeType;
}
export interface UserGroupPosterShape {
  GroupName: string;
  Animes: UserAnimePosterShape[];
}
/* AnimeDB */
export interface AnimeShape {
  title: string;
  AlternativeTitle: AlternativeTitleShape;
  photoPath: string;
  OverallScore: number;
  ScoredBy: number;
  EpisodesData?: JikanApiResAnimeEpisodes[];
  Recommendations: JikanApiResAnimeRecommandations[];
  Airing: boolean;
  Status: AnimeStatusType;
  ReleaseDate: string;
  AgeRating: string;
  Synopsis: string;
  trailer_url: string;
  MalPage: string;
  type: AnimeType;
  Studios: StudiosShape[];
  Genre: TagsShape[];
  Theme: TagsShape[];
  nbEp: number;
  duration: string;
  malId: number;
}
export interface StudiosShape {
  name: string;
  mal_id: number;
  type: string;
  url: string;
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
  type: AnimeType;
  source: string;
  episodes: number;
  status: AnimeStatusType | number;
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
  genres: TagsShape[];
  explicit_genres: ExplicitGenre[];
  demographics: Demographic[];
  themes: TagsShape[];
  opening_themes: string[];
  ending_themes: string[];
  external_links: ExternalLink[];
}

/* JikanRes on /anime/episodes */
export interface JikanApiResEpisodes {
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
  episodes_last_page: number;
  episodes: JikanApiResAnimeEpisodes[];
  status: number;
}
export interface JikanApiResAnimeEpisodes {
  episode_id: number;
  title: string;
  title_japanese: string;
  title_romanji: string;
  aired: Date;
  filler: boolean;
  recap: boolean;
  video_url: string;
  forum_url: string;
}

/* JikanRes on /anime/recommendations */
export interface JikanApiResRecommandations {
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
  recommendations: JikanApiResAnimeRecommandations[];
  status: number;
}
export interface JikanApiResAnimeRecommandations {
  mal_id: number;
  url: string;
  image_url: string;
  recommendation_url: string;
  title: string;
  recommendation_count: number;
}

/* JikanRes on /season */
export interface JikanApiResSeasonRoot {
  request_hash: string;
  request_cached: boolean;
  request_cache_expiry: number;
  season_name: string;
  season_year: number;
  status: number;
  anime: JikanApiResSeasonAnime[];
}

export interface JikanApiResSeasonAnime {
  mal_id: number;
  url: string;
  title: string;
  image_url: string;
  synopsis: string;
  type: AnimeType;
  airing_start?: string;
  episodes?: number;
  members: number;
  genres: Genre[];
  explicit_genres: ExplicitGenre[];
  themes: Theme[];
  demographics: Demographic[];
  source: string;
  producers: Producer[];
  score?: number;
  licensors: string[];
  r18: boolean;
  kids: boolean;
  continuing: boolean;
}

/* Sub Interface */
export interface Genre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface ExplicitGenre {
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

export interface Demographic {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface TagsShape {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface ExternalLink {
  name: string;
  url: string;
}
