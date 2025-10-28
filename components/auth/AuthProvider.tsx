"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { getClientAuth } from "@/lib/firebase/client";
import { signInWithGitHub, signOutUser } from "@/lib/firebase/auth-client";

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getClientAuth();
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);

        if (!firebaseUser) {
          setIsAdmin(false);
          return;
        }

        try {
          const response = await fetch("/api/auth/session");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(Boolean(data.isAdmin));
            setError(null);
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      });
    } catch (configError) {
      const message =
        configError instanceof Error
          ? configError.message
          : "Firebase configuration is incomplete.";
      setError(message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await signInWithGitHub();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "GitHub sign-in failed.";
      setError(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await signOutUser();
      setIsAdmin(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not sign out user.";
      setError(message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      loading,
      error,
      signIn,
      signOut,
    }),
    [user, isAdmin, loading, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
