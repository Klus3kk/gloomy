import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

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

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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
      adminApp =
        getApps().length > 0
          ? getApp()
          : initializeApp({
              credential,
              projectId: fallbackProjectId,
            });
      return adminApp;
    }
    adminApp =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            credential,
            projectId: inferredProjectId,
          });
    return adminApp;
  }

  adminApp =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential,
          projectId,
        });

  return adminApp;
};

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
