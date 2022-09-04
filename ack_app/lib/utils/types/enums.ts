export enum AnimeWatchType {
  UNWATCHED = "unwatched",
  WATCHED = "watched",
  WATCHING = "watching",
  WANT_TO_WATCH = "want_to_watch",
  WONT_WATCH = "wont_watch",
  DROPPED = "dropped",
}
export enum AnimeWatchTypeDisplayable {
  WATCHED = "watched",
  WATCHING = "watching",
  WANT_TO_WATCH = "want_to_watch",
  DROPPED = "dropped",
  ALL = "all",
  FAV = "favorite",
}

export enum TheFourSeasonEnum {
  WINTER = "winter",
  SPRING = "spring",
  SUMMER = "summer",
  FALL = "fall",
}

export enum HomeDisplayTypeEnum {
  GROUP,
  ANIMES,
}

export enum SupportedAnimeProvider {
  GOGOANIME = "https://gogoanime.ee",
  ANIMIXPLAY = "https://animixplay.to",
  ANIMEVIBE = "https://lite.animevibe.se",
}

export const ProvidersInfo = {
  [SupportedAnimeProvider.GOGOANIME]: {},
};
// "https://lite-api.animemate.xyz/Anime";
