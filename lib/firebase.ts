/* eslint-disable react-hooks/rules-of-hooks */
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, DocumentSnapshot } from "firebase/firestore";

// Init
const firebaseConfig = {
  apiKey: "AIzaSyDihE5yYCzxD2sJRy1FS4Y47Lkp7kiZPQ8",
  authDomain: "ackv2-652fc.firebaseapp.com",
  projectId: "ackv2-652fc",
  storageBucket: "ackv2-652fc.appspot.com",
  messagingSenderId: "277886610954",
  appId: "1:277886610954:web:d82d787211cd5c583fb9f3",
  measurementId: "G-CMVYL0SD32",
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Export FB Func

export const auth = getAuth();
export const db = getFirestore();

// Utility Func

/**`
 * Converts a firestore doc to JSON
 * @param  {DocumentSnapshot} doc
 */
export function postToJSON(doc: DocumentSnapshot) {
  const data = doc.data();
  return {
    ...data,
  };
}

export const removeDuplicates = (ary: any[]) => {
  return [...Array.from(new Set(ary))];
};
