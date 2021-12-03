import { DocumentSnapshot } from "@firebase/firestore";
import { AnimeShape, JikanApiResAnime } from "./types/interface";
import { AnimeStatusType } from "./types/types";

/**
 * Is the string a valid url (https://www.example.com)
 * @param {URL} url
 * @returns true | false
 */
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Get Data with SWR
 * @param {URL} url
 */
export async function callApi(url: string) {
  if (!isValidUrl(url)) return;
  const req = await fetch(url);
  return await req.json();
}

/**
 * Converts a firestore doc to JSON
 * @param {DocumentSnapshot} doc
 */
export function postToJSON(doc: DocumentSnapshot) {
  const data = doc.data();
  return {
    ...data,
  };
}

/**
 * Remove already existing obj in array
 * @param {any[]} ary
 */
export function removeDuplicates<T>(ary: T[]) {
  return [...Array.from(new Set(ary))];
}

/**
 * Transform JikanApi obj to AnimeShape obj
 * @param {any[]} ary
 */
export function JikanApiToAnimeShape(JikanObj: JikanApiResAnime): AnimeShape {
  return {
    title: JikanObj.title,
    Genre: JikanObj.genres,
    AgeRating: JikanObj.rating,
    Airing: JikanObj.airing,
    AlternativeTitle: {
      title_english: JikanObj.title_english,
      title_japanese: JikanObj.title_japanese,
      title_synonyms: JikanObj.title_synonyms,
    },
    OverallScore: JikanObj.score,
    ScoredBy: JikanObj.scored_by,
    Status: JikanObj.status as AnimeStatusType,
    type: JikanObj.type,
    ReleaseDate: JikanObj.premiered,
    Synopsis: JikanObj.synopsis,
    Studios: JikanObj.studios,
    Theme: JikanObj.themes,
    photoPath: JikanObj.image_url,
    malId: JikanObj.mal_id,
    trailer_url: JikanObj.trailer_url,
    nbEp: JikanObj.episodes,
    MalPage: JikanObj.url,
    duration: JikanObj.type === "Movie" ? JikanObj.duration : JikanObj.duration,
  };
}

/**
 * Remove ?s= from photoURL
 * @param {string} photoURL
 */
export const removeParamsFromPhotoUrl = (photoUrl: string) =>
  photoUrl.split("?s=")[0];
