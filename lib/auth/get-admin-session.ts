import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import { adminAuth } from "@/lib/firebase/admin";
import { isAuthorizedAdmin } from "./is-authorized-admin";

const SESSION_COOKIE = "gloomySession";

export type AdminSession = {
  uid: string;
  email: string | null;
  name: string | null;
  rawToken: DecodedIdToken;
};

export const getAdminSession = async (): Promise<AdminSession | null> => {
  const sessionCookie = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    if (!isAuthorizedAdmin(decoded)) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      rawToken: decoded,
    };
  } catch (error) {
    console.error("Failed to validate admin session", error);
    return null;
  }
};
