"use client";

import {
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  type UserCredential,
} from "firebase/auth";

import { getClientAuth } from "./client";

const sessionEndpoint = "/api/auth/session";

const postSession = async (idToken: string) => {
  const response = await fetch(sessionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error ??
        "Unable to establish an admin session for this GitHub account.",
    );
  }
};

const deleteSession = async () => {
  await fetch(sessionEndpoint, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const signInWithGitHub = async (): Promise<UserCredential> => {
  const auth = getClientAuth();
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");

  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();

  try {
    await postSession(idToken);
  } catch (error) {
    await signOut(auth);
    throw error;
  }

  return credential;
};

export const signOutUser = async (): Promise<void> => {
  const auth = getClientAuth();
  await signOut(auth);
  await deleteSession();
};
