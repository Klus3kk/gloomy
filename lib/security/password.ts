const PBKDF2_ITERATIONS = 210_000;
const KEY_LENGTH_BITS = 256;
const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const getSubtle = () => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto API is unavailable in this environment.");
  }
  return subtle;
};

const deriveKey = async (password: string, salt: Uint8Array) => {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    KEY_LENGTH_BITS,
  );

  return new Uint8Array(derivedBits);
};

const randomSalt = () => {
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);
  return salt;
};

export const hashPassword = async (password: string) => {
  const salt = randomSalt();
  const hashBytes = await deriveKey(password, salt);
  return {
    hash: toBase64(hashBytes),
    salt: toBase64(salt),
  };
};

export const verifyPassword = async (
  password: string,
  saltBase64: string,
  expectedHash: string,
) => {
  const salt = fromBase64(saltBase64);
  const hashBytes = await deriveKey(password, salt);
  const hash = toBase64(hashBytes);
  return hash === expectedHash;
};
