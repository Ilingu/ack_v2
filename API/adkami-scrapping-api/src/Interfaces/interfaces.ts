/* eslint-disable prettier/prettier */

export interface AdkamiNewEpisodeShape {
  title: string; // Black Clover
  episodeId: string; // Episode 28 vostfr
  TimeReleased: string; // 28min ago
  Img: string; // Img of anime
  Team: string; // Wakanim
}
export interface CachedDOMShape {
  lastRefresh: number;
  DOMObject: AdkamiNewEpisodeShape[];
}
