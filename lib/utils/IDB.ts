import { openDB } from "idb";
import { IDBShape } from "./types/interface";

const GetIDB = async () =>
  await openDB("ACK_IDB", 1, {
    upgrade(db) {
      db.createObjectStore("GlobalAnimesDatas", {
        keyPath: "Id",
        autoIncrement: true,
      });
    },
    blocked() {
      alert("Close All Duplicate Windows.");
    },
    blocking() {},
    terminated() {},
  });

/**
 * Get datas from key in IndexedDB and returns it
 * @returns {Promise<[IDBShape]>} GetIDBAnimes (Promise)
 */
export const GetIDBAnimes = async (): Promise<[IDBShape]> => {
  try {
    const db = await GetIDB();
    const store = db
      .transaction("GlobalAnimesDatas")
      .objectStore("GlobalAnimesDatas");
    return (await store.getAll()) as unknown as Promise<[IDBShape]>;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Create key with the given data in IndexedDB
 * @param {string} where
 * @param {object} data
 */
export const WriteIDB = async (data: IDBShape) => {
  try {
    const db = await GetIDB();
    const store = db
      .transaction("GlobalAnimesDatas", "readwrite")
      .objectStore("GlobalAnimesDatas");

    await store.clear();
    await store.add(data);
  } catch (err) {
    console.error(err);
  }
};

/**
 * Clear all data in IndexedDB
 */
export const ClearIDB = async () => {
  try {
    const db = await GetIDB();
    const store = db
      .transaction("GlobalAnimesDatas", "readwrite")
      .objectStore("GlobalAnimesDatas");

    await store.clear();
  } catch (err) {
    console.error(err);
  }
};

/**
 * Delete Anime in IDB with its animeID
 * @param {number} AnimeID
 */
export const DeleteAnimeIDB = async (AnimeID: number) => {
  const CachedAnimesDatas = await GetIDBAnimes();
  if (!!CachedAnimesDatas && CachedAnimesDatas.length > 0) {
    const CachedAnimesObject = CachedAnimesDatas[0];
    if (CachedAnimesObject?.AnimesStored?.length > 0) {
      const AnimesCopy = [...CachedAnimesObject?.AnimesStored];
      const IndexToDel = AnimesCopy.findIndex(
        ({ malId: currAnimeID }) => currAnimeID === AnimeID
      );
      if (IndexToDel !== -1) {
        AnimesCopy.splice(IndexToDel, 1);
        await WriteIDB({
          AnimesStored: AnimesCopy,
          expire: CachedAnimesObject.expire,
        });
      }
    }
  }
};
