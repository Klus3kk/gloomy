import type { DecodedIdToken } from "firebase-admin/auth";

const normalizeList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];

const allowedEmails = normalizeList(process.env.GITHUB_ALLOWED_EMAILS);
const allowedHandles = normalizeList(process.env.GITHUB_ALLOWED_USERNAMES);

export const isAuthorizedAdmin = (token: DecodedIdToken): boolean => {
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
