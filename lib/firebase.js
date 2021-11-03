import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const storage = getStorage();
