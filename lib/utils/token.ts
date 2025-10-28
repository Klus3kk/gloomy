const DEFAULT_LENGTH = 10;

const base62 = "abcdefghijklmnopqrstuvwxyz0123456789";

const randomFromCharset = (length: number) => {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (value) => base62[value % base62.length]).join("");
  }

  return Array.from({ length }, () =>
    base62.charAt(Math.floor(Math.random() * base62.length)),
  ).join("");
};

export const generateShortToken = (length = DEFAULT_LENGTH) => {
  if (length <= 0) return randomFromCharset(DEFAULT_LENGTH);
  return randomFromCharset(length);
};
