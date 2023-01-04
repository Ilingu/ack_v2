import crypto from "crypto";
// DB
import { DocumentSnapshot } from "@firebase/firestore";
// Types
import type {
  FunctionJob,
  JikanApiERROR,
  UserAnimeShape,
  ZoroProvider,
} from "./types/interface";
import { AnimeWatchType } from "./types/enums";
import { ProviderUIInfo } from "./types/types";

/* UTILS FUNC */
/**
 * Encrypt data
 * @param {Buffer} cookie
 */
export const encryptDatas = (cookie: Buffer) => {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.NEXT_PUBLIC_COOKIES_ENCRYPT_KEY),
      iv
    );
    const encryptedCookie = Buffer.concat([
      Buffer.from("v10"),
      iv,
      cipher.update(cookie),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
    return encryptedCookie;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Decrypt data
 * @param {Buffer} encryptedCookie
 */
export const decryptDatas = (encryptedCookie: Buffer): string => {
  try {
    const iv = encryptedCookie.slice(3, 3 + 12);
    const ciphertext = encryptedCookie.slice(
      3 + 12,
      encryptedCookie.length - 16
    );
    const authTag = encryptedCookie.slice(encryptedCookie.length - 16);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.NEXT_PUBLIC_COOKIES_ENCRYPT_KEY),
      iv
    );
    decipher.setAuthTag(authTag);
    const decryptedCookie = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decryptedCookie.toString("utf8");
  } catch (err) {
    console.error(err);
    return null;
  }
};

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
 * Converts UserAnime array into filteredOne (Exclude UNWATCHED && WONT_WATCH)
 * @param {UserAnimeShape[]} UserAnimes
 */
export const filterUserAnime = (UserAnimes: UserAnimeShape[]) =>
  UserAnimes?.filter(
    ({ WatchType }) =>
      WatchType !== AnimeWatchType.WONT_WATCH &&
      WatchType !== AnimeWatchType.UNWATCHED
  );

/**
 * Converts a firestore doc to JSON
 * @param {DocumentSnapshot} doc
 */
export function postToJSON(
  doc:
    | DocumentSnapshot
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
) {
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
 * Check If object a and b are equals
 * @param {object} x
 * @param {object} y
 * @returns {boolean} `true` if objects are equals
export function deepEqual(x: object, y: object): boolean {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
} */

export function SpotDifferenciesBetweenArrays<T = number>(
  BaseArray: any[],
  ArrayToCompare: any[],
  BaseArrayKeyToExport: string,
  CompareArrayKeyToExport: string
): T[] {
  const Base = BaseArray.map((obj) => obj[BaseArrayKeyToExport]);
  const Compare = ArrayToCompare.map((obj) => obj[CompareArrayKeyToExport]);
  const MissingDependencies = Base.filter(
    (Comparatif) => !Compare.includes(Comparatif)
  );
  return MissingDependencies;
}

/**
 * Is the Api Req an error ?
 * @param {JikanApiERROR} api_response
 * @returns {boolean} true | false
 */
export const IsError = (api_response: JikanApiERROR): boolean => {
  return !api_response || !!api_response?.error;
};

type Return404Shape = { notFound: true; revalidate?: number };
/**
 * @returns 404's Page
 */
export const Return404 = (revalidate = 0): Return404Shape => ({
  notFound: true,
  revalidate: revalidate !== 0 ? revalidate : undefined,
});

/**
 * Randomly Suffle the Array in params
 * @param {Array} ArrayToShuffle
 * @returns The randomly shuffled array
 */
export const shuffleArray = <T>(ArrayToShuffle: T[]): T[] =>
  ArrayToShuffle.sort(() => Math.random() - 0.5);

/**
 * Copy Text To User Clipbord
 * @param {string} text
 */
export const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text);

/**
 * Check whether a string is Empty or Not
 * @param {string} str
 * @returns {boolean} `true` if the string is empty
 */
export const IsEmptyString = (str: unknown): boolean =>
  !str || typeof str !== "string" || str.trim().length <= 0;

export const ParseCookies = (
  RawCookies: string
): FunctionJob<{ [K: string]: string }> => {
  try {
    const cookies = RawCookies.split("; ");
    const ParsedCookies = cookies.reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      return { ...acc, ...{ [key]: value } };
    }, {});

    return { success: true, data: ParsedCookies };
  } catch (err) {
    return { success: false };
  }
};

export const GetProviderUIInfo = (): ProviderUIInfo => [
  "rgb(7,191,103)",
  "/Assets/yugen.png",
];

export const GenerateEpProviderUrl = (YugenId: string, epId: number): string =>
  `https://yugen.to/watch/${YugenId}/x/${epId}/`;

export const GenerateProviderUrl = (YugenId: string) =>
  `https://yugen.to/anime/${YugenId}`;

export function pickTextColorBasedOnBgColor(bgColor: string) {
  const color = bgColor.charAt(0) === "#" ? bgColor.substring(1, 7) : bgColor;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#222" : "#fff";
}
