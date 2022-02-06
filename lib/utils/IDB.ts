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

// /**
//  * Update key with the new given data in IndexedDB
//  * @param {string} where
//  * @param {object} data
//  */
// export const UpdateIDB = async (data: IDBShape) => {
//   try {
//     const db = await GetIDB();
//     const store = db
//       .transaction("GlobalAnimesDatas", "readwrite")
//       .objectStore("GlobalAnimesDatas");
//     await store.put(data);
//   } catch (err) {
//     console.error(err);
//   }
// };

// export const DeleteIDB = async (where: string) => {
//   try {
//     const db = await GetIDB();
//     const store = db
//       .transaction("GlobalAnimesDatas", "readwrite")
//       .objectStore("GlobalAnimesDatas");
//     await store.delete(where);
//   } catch (err) {
//     console.error(err);
//   }
// };
