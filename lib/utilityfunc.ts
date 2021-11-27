import { DocumentSnapshot } from "@firebase/firestore";
import { JikanApiResAnime, JikanApiResSearchAnime } from "./types/interface";

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
export function JikanApiToAnimeShape(
  JikanObj: JikanApiResAnime | JikanApiResSearchAnime[],
  ObjType: "ResAnime" | "ResSearch"
) {
  if (ObjType === "ResSearch") {
  }
  // Else: ResAnime
  return;
}

/**
 * Remove ?s= from photoURL
 * @param {string} photoURL
 */
export const removeParamsFromPhotoUrl = (photoUrl: string) =>
  photoUrl.split("?s=")[0];
