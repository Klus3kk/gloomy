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
    let isMounted = true;

    try {
      const auth = getClientAuth();
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) {
          return;
        }

        const visibleUser =
          firebaseUser && !firebaseUser.isAnonymous ? firebaseUser : null;

        setUser(visibleUser);
        setLoading(false);

        if (!firebaseUser) {
          setIsAdmin(false);
          return;
        }

        if (firebaseUser.isAnonymous) {
          setIsAdmin(false);
          return;
        }

        const fetchSession = async (attempt = 0): Promise<void> => {
          try {
            const response = await fetch("/api/auth/session", {
              cache: "no-store",
              headers: {
                Accept: "application/json",
              },
            });

            if (!isMounted) {
              return;
            }

            if (response.ok) {
              const data = await response.json();
              setIsAdmin(Boolean(data.isAdmin));
              setError(null);
              return;
            }

            const payload = await response.json().catch(() => ({}));
            const shouldRetry =
              response.status === 401 &&
              payload?.reason === "No session cookie present." &&
              attempt < 3;

            if (shouldRetry) {
              await new Promise((resolve) =>
                setTimeout(resolve, 150 * Math.pow(2, attempt)),
              );
              if (!isMounted) {
                return;
              }
              await fetchSession(attempt + 1);
              return;
            }

            if (
              response.status === 401 &&
              payload?.reason === "No session cookie present."
            ) {
              try {
                await signOutUser();
              } catch (signOutError) {
                console.warn(
                  "Failed to sign out after missing session cookie",
                  signOutError,
                );
              }
              if (isMounted) {
                setUser(null);
                setIsAdmin(false);
              }
              return;
            }
          } catch {
            // Ignore; will fall through to setIsAdmin(false).
          }

          if (isMounted) {
            setIsAdmin(false);
          }
        };

        await fetchSession();
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
      isMounted = false;
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
