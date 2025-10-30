import {
  applicationDefault,
  cert,
  getApp,
  initializeApp,
} from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

const globalKey = "__gloomyFirebaseAdminApp__";
type GlobalFirebaseState = {
  [globalKey]?: App;
};

const globalForAdmin = globalThis as typeof globalThis & GlobalFirebaseState;
if (globalForAdmin[globalKey]) {
  adminApp = globalForAdmin[globalKey];
}

const cacheAdminApp = (app: App) => {
  adminApp = app;
  globalForAdmin[globalKey] = app;
};

const isNoDefaultAppError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error as { code?: string; message?: unknown };
  if (candidate.code === "app/no-app") {
    return true;
  }
  if (typeof candidate.message === "string") {
    return candidate.message.includes(
      "The default Firebase app does not exist",
    );
  }
  return false;
};

const getExistingDefaultApp = (): App | undefined => {
  try {
    return getApp();
  } catch (error) {
    if (isNoDefaultAppError(error)) {
      return undefined;
    }
    throw error;
  }
};

const resolveProjectId = (): string | undefined =>
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.GCP_PROJECT ??
  process.env.FIREBASE_PROJECT ??
  process.env.PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  (() => {
    const configRaw = process.env.FIREBASE_CONFIG;
    if (!configRaw) return undefined;
    try {
      const parsed = JSON.parse(configRaw) as { projectId?: string } | undefined;
      return parsed?.projectId;
    } catch (error) {
      console.warn(
        "FIREBASE_CONFIG was present but could not be parsed as JSON.",
        error instanceof Error ? error.message : error,
      );
      return undefined;
    }
  })();

const getAdminApp = (): App => {
  if (adminApp) {
    return adminApp;
  }

  const existing = getExistingDefaultApp();
  if (existing) {
    cacheAdminApp(existing);
    return existing;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey =
    process.env.FIREBASE_PRIVATE_KEY ??
    (process.env.FIREBASE_PRIVATE_KEY_BASE64
      ? Buffer.from(
          process.env.FIREBASE_PRIVATE_KEY_BASE64,
          "base64",
        ).toString("utf8")
      : undefined);
  const privateKey = rawPrivateKey?.replace(/\\n/g, "\n");

  const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);

  const credential = hasServiceAccount
    ? cert({
        projectId,
        clientEmail,
        privateKey,
      })
    : (() => {
        try {
          return applicationDefault();
        } catch (error) {
          const detail =
            error instanceof Error && error.message
              ? ` Details: ${error.message}`
              : "";
          throw new Error(
            `Firebase Admin credentials are not configured and application default credentials are unavailable. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.${detail}`,
          );
        }
      })();

  if (!hasServiceAccount) {
    const inferredProjectId = resolveProjectId();
    if (!inferredProjectId) {
      const fallbackProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!fallbackProjectId) {
        throw new Error(
          "Firebase Admin credentials are missing and the project ID could not be inferred from the environment. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY or configure application default credentials.",
        );
      }
      const app = initializeApp({
        credential,
        projectId: fallbackProjectId,
      });
      cacheAdminApp(app);
      return app;
    }
    const app = initializeApp({
      credential,
      projectId: inferredProjectId,
    });
    cacheAdminApp(app);
    return app;
  }

  const app = initializeApp({
    credential,
    projectId,
  });
  cacheAdminApp(app);
  return app;
};

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
