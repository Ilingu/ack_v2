import * as admin from "firebase-admin";

const isTestEnv = process.env.NODE_ENV === "test";

if (!admin.apps.length && !isTestEnv) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = !isTestEnv && admin.firestore();
const auth = !isTestEnv && admin.auth();
const deleteField = !isTestEnv && admin.firestore.FieldValue.delete;

export { db, auth, deleteField };
