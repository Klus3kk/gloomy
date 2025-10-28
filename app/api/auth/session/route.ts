import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase/admin";
import { isAuthorizedAdmin } from "@/lib/auth/is-authorized-admin";

const SESSION_COOKIE = "gloomySession";
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

const getCookieStore = async () => Promise.resolve(cookies());

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing idToken in request body." },
        { status: 400 },
      );
    }

    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);

    if (!isAuthorizedAdmin(decoded)) {
      return NextResponse.json(
        { error: "This GitHub account is not authorized for admin access." },
        { status: 403 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({
      isAdmin: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Failed to create admin session", error);
    return NextResponse.json(
      { error: "Unable to create admin session." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const cookieStore = await getCookieStore();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  if (!sessionCookie) {
    return NextResponse.json(
      { isAdmin: false, reason: "No session cookie present." },
      { status: 401 },
    );
  }

  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    if (!isAuthorizedAdmin(decoded)) {
      return NextResponse.json(
        { isAdmin: false, reason: "Account not authorized." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      isAdmin: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
  } catch (error) {
    console.error("Session validation failed", error);
    return NextResponse.json(
      { isAdmin: false, reason: "Session invalid or expired." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await getCookieStore();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  if (!sessionCookie) {
    return response;
  }

  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    await auth.revokeRefreshTokens(decoded.sub);
  } catch (error) {
    console.error("Unable to revoke session cookie", error);
  }

  return response;
}
