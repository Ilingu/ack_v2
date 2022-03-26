import { User } from "firebase/auth";
import { AnimeWatchType } from "./enums";
import {
  AnimeStatusType,
  AnimeType,
  NetworkEffectiveType,
  NetworkType,
} from "./types";

declare global {
  interface Window {
    opera: any;
    appVersion: () => "Web" | "PWA";
  }
  interface Navigator {
    userAgentData: any;
  }
}

// Api routes
export interface ResApiRoutes {
  succeed: boolean;
  code: number;
  data?: object;
  message?: string;
}
export interface InternalApiResError {
  message?: string;
  err: boolean;
}
export interface InternalApiResSuccess {
  AddedToDB: boolean;
  AnimeUpdated: boolean;
  AnimeData: AnimeShape;
}
export interface ResDataUser {
  User: User;
  NoOfAnimes: number;
  NoOfWatchAnimes: number;
  UserFavoriteAnime: string;
}
// Algolia
export interface AlgoliaResShape {
  success: boolean;
  data?: AlgoliaDatasShape[];
}
export interface AlgoliaDatasShape {
  title: string;
  AlternativeTitle: AlternativeTitleShape;
  OverallScore: number;
  photoPath: string;
  type: AnimeType;
  objectID: number;
}
// Others
export interface IDBShape {
  expire: number;
  AnimesStored: AnimeShape[];
}
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
export interface UserStatsShape {
  data: string | number;
  desc: string;
  Modifiable?: boolean;
}
/* LastEpReleased */
export interface AdkamiLastReleasedEpisodeShape {
  title: string; // Black Clover
  episodeId: string; // Episode 28 vostfr
  TimeReleased: string; // 28min ago
  Img: string;
  Team: string; // Wakanim
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
  BeginAiring: string;
  MalId: number;
}
/* User Anime */
export interface UserAnimeShape {
  AnimeId: number;
  WatchType: AnimeWatchType;
  Fav: boolean;
  Progress?: number[];
  TimestampDate?: UserAnimeTimestampDate;
  ExtraEpisodes?: number;
  NewEpisodeAvailable?: boolean;
  NextEpisodeReleaseDate?: number;
}
export interface UserAnimeTimestampDate {
  BeganDate: string; // Timestamp
  EndedDate: string; // Timestamp
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
  NewEpisodeAvailable?: boolean;
  NextEpisodeReleaseDate?: number;
}
export interface UserGroupPosterShape {
  GroupName: string;
  Animes: UserAnimePosterShape[];
}
export interface UserExtraEpisodesShape extends JikanApiResEpisodes {
  isExtra?: true;
}
/* AnimeDB */
export interface AnimeShape {
  title: string;
  AlternativeTitle: AlternativeTitleShape;
  photoPath: string;
  OverallScore: number;
  ScoredBy: number;
  EpisodesData?: JikanApiResEpisodes[];
  Recommendations: JikanApiResRecommandations[];
  Airing: boolean;
  AiringDate: string;
  Status: AnimeStatusType;
  ReleaseDate: string;
  AgeRating: string;
  Synopsis: string;
  trailer_url: string;
  MalPage: string;
  broadcast: string;
  type: AnimeType;
  Studios: Studio[];
  Genre: GenreTag[];
  Theme: GenreTag[];
  nbEp: number;
  duration: string;
  malId: number;
  NextRefresh: number;
}
export interface AlternativeTitleShape {
  title_english: string;
  title_japanese: string;
  title_synonyms: string[];
}
/* adkami-api Error */
export interface ADKamiScrapperApiERROR {
  statusCode: number;
  message: string;
}
/* JikanRes Error */
export interface JikanApiERROR {
  status: number;
  type: string;
  message: string;
  error: string;
  report_url: string;
}
/* JikanRes on /search */
export interface JikanApiResSearchRoot {
  pagination: Pagination;
  data: JikanApiResSearch[];
}

export interface JikanApiResSearch {
  mal_id: number;
  url: string;
  images: Images;
  trailer: Trailer;
  title: string;
  title_english?: string;
  title_japanese: string;
  title_synonyms: string[];
  type: AnimeType;
  source: string;
  episodes?: number;
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
  background?: string;
  season?: string;
  year?: number;
  broadcast: Broadcast;
  producers: Producer[];
  licensors: Licensor[];
  studios: Studio[];
  genres: GenreTag[];
  explicit_genres: any[];
  themes: GenreTag[];
  demographics: Demographic[];
}

/* JikanRes on /anime */
export interface JikanApiResAnimeRoot {
  data: JikanApiResAnime;
}

export interface JikanApiResAnime {
  mal_id: number;
  url: string;
  images: Images;
  trailer: Trailer;
  title: string;
  title_english: string;
  title_japanese: string;
  title_synonyms: string[];
  type: AnimeType;
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
  background: any;
  season: string;
  year: number;
  broadcast: Broadcast;
  producers: Producer[];
  licensors: Licensor[];
  studios: Studio[];
  genres: GenreTag[];
  explicit_genres: any[];
  themes: GenreTag[];
  demographics: Demographic[];
}

/* JikanRes on /anime/episodes */
export interface JikanApiResEpisodesRoot {
  pagination: Pagination;
  data: JikanApiResEpisodes[];
}

export interface JikanApiResEpisodes {
  mal_id: number;
  url?: string;
  title?: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  filler?: boolean;
  recap?: boolean;
  forum_url?: string;
}

/* JikanRes on /anime/recommendations */
export interface JikanApiResRecommandationsRoot {
  data: JikanApiResRecommandations[];
}

export interface JikanApiResRecommandations {
  entry: Entry;
  url: string;
  votes: number;
}

export interface Entry {
  mal_id: number;
  url: string;
  images: Images;
  title: string;
}

/* JikanRes on /season */
export interface JikanApiResSeasonRoot {
  pagination: Pagination;
  data: JikanApiResSeason[];
}

export interface JikanApiResSeason {
  mal_id: number;
  url: string;
  images: Images;
  trailer: Trailer;
  title: string;
  title_english?: string;
  title_japanese: string;
  title_synonyms: string[];
  type: AnimeType;
  source: string;
  episodes?: number;
  status: string;
  airing: boolean;
  aired: Aired;
  duration: string;
  rating: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity: number;
  members: number;
  favorites: number;
  synopsis: string;
  background: any;
  season: string;
  year: number;
  broadcast: Broadcast;
  producers: Producer[];
  licensors: Licensor[];
  studios: Studio[];
  genres: GenreTag[];
  explicit_genres: any[];
  themes: GenreTag[];
  demographics: Demographic[];
}

/* Sub Interface */
//#region
export interface Images {
  jpg: Jpg;
  webp: Webp;
}

export interface Jpg {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface Webp {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface Trailer {
  youtube_id: string;
  url: string;
  embed_url: string;
  images: Images2;
}

export interface Images2 {
  image_url: string;
  small_image_url: string;
  medium_image_url: string;
  large_image_url: string;
  maximum_image_url: string;
}

export interface Aired {
  from: string;
  to: string | null;
  prop: Prop;
  string: string;
}

export interface Prop {
  from: From;
  to: To;
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

export interface Broadcast {
  day: string;
  time: string;
  timezone: string;
  string: string;
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

export interface GenreTag {
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

export interface Pagination {
  last_visible_page: number;
  has_next_page: boolean;
}
//#endregion

/* Other Types */
export interface BeforeInstallPromptEvent extends Event {
  /**
   * Returns an array of DOMString items containing the platforms on which the event was dispatched.
   * This is provided for user agents that want to present a choice of versions to the user such as,
   * for example, "web" or "play" which would allow the user to chose between a web version or
   * an Android version.
   */
  readonly platforms: Array<string>;

  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;
}
