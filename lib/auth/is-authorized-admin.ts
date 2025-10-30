import type { DecodedIdToken } from "firebase-admin/auth";

const normalizeList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];

type AdminConfig = {
  emails: string[];
  handles: string[];
};

let cachedConfig: AdminConfig | null = null;

const loadConfig = (): AdminConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const envEmails =
    process.env.GITHUB_ALLOWED_EMAILS ??
    process.env.NEXT_PUBLIC_GITHUB_ALLOWED_EMAILS ??
    "";
  const envHandles =
    process.env.GITHUB_ALLOWED_USERNAMES ??
    process.env.NEXT_PUBLIC_GITHUB_ALLOWED_USERNAMES ??
    "";

  let emails = normalizeList(envEmails);
  let handles = normalizeList(envHandles);

  if (emails.length === 0 && handles.length === 0) {
    try {
      const functions = require("firebase-functions") as typeof import("firebase-functions");
      const config = functions.config?.() ?? {};
      const gloomyConfig = (config as Record<string, unknown>).gloomy as
        | {
            github_allowed_emails?: string;
            github_allowed_usernames?: string;
          }
        | undefined;

      if (gloomyConfig?.github_allowed_emails) {
        emails = normalizeList(gloomyConfig.github_allowed_emails);
      }
      if (gloomyConfig?.github_allowed_usernames) {
        handles = normalizeList(gloomyConfig.github_allowed_usernames);
      }
    } catch (error) {
      console.warn(
        "firebase-functions config unavailable; falling back to environment variables for admin auth checks.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  cachedConfig = { emails, handles };
  return cachedConfig;
};

export const isAuthorizedAdmin = (token: DecodedIdToken): boolean => {
  const { emails: allowedEmails, handles: allowedHandles } = loadConfig();

  const signInProvider = token.firebase?.sign_in_provider;
  if (signInProvider !== "github.com") {
    return false;
  }

  const email = token.email?.toLowerCase();
  if (allowedEmails.length > 0 && email && allowedEmails.includes(email)) {
    return true;
  }

  const providerIdentities = token.firebase?.identities?.["github.com"];
  if (
    allowedHandles.length > 0 &&
    Array.isArray(providerIdentities) &&
    providerIdentities.some((value) =>
      allowedHandles.includes(String(value).toLowerCase()),
    )
  ) {
    return true;
  }

  const allowAll = allowedEmails.length === 0 && allowedHandles.length === 0;
  return allowAll;
};
