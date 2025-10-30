import { randomBytes } from "node:crypto";

const DEFAULT_LENGTH = 10;
const SHORT_CHARSET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const hasWebCrypto =
  typeof crypto !== "undefined" && "getRandomValues" in crypto;

const getRandomBytes = (size: number) => {
  if (size <= 0) {
    throw new Error("Requested random byte size must be positive.");
  }

  if (hasWebCrypto) {
    const array = new Uint8Array(size);
    crypto.getRandomValues(array);
    return array;
  }

  return randomBytes(size);
};

const randomFromCharset = (length: number) => {
  const bytes = getRandomBytes(length);
  return Array.from(bytes, (value) => {
    const index = value % SHORT_CHARSET.length;
    return SHORT_CHARSET.charAt(index);
  }).join("");
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  // Fallback: convert to base64url using browser btoa
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  if (typeof btoa === "function") {
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  throw new Error("No base64 encoder available in this environment.");
};

export const generateShortToken = (length = DEFAULT_LENGTH) => {
  if (length <= 0) {
    return randomFromCharset(DEFAULT_LENGTH);
  }
  return randomFromCharset(length);
};

export const generateSecureToken = (byteLength = 32) => {
  const bytes = getRandomBytes(byteLength);
  try {
    return bytesToBase64Url(bytes);
  } catch (error) {
    console.error("Falling back to charset token generation", error);
    // Fallback to a longer base62 token if base64url conversion fails.
    return randomFromCharset(byteLength * 2);
  }
};
