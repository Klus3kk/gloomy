import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

const assertClientConfig = () => {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase client configuration values: ${missing.join(
        ", ",
      )}. Ensure NEXT_PUBLIC_FIREBASE_* env vars are set.`,
    );
  }
};

export const getClientApp = (): FirebaseApp => {
  if (cachedApp) return cachedApp;

  assertClientConfig();

  cachedApp =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp(firebaseConfig as Record<string, string>);

  return cachedApp;
};

export const getClientAuth = (): Auth => {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getClientApp());
  return cachedAuth;
};

export const getClientFirestore = (): Firestore => {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getClientApp());
  return cachedDb;
};
