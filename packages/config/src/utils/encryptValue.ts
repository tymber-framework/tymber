import { randomBytes, createCipheriv, scryptSync } from "node:crypto";

export const ALGORITHM = "aes-192-cbc";

export function encryptValue(value: string, secret: string) {
  const initVector = randomBytes(16);
  const key = scryptSync(secret, "salt", 24);
  const cipher = createCipheriv(ALGORITHM, key, initVector);

  const encrypted =
    cipher.update(value, "utf8", "base64") + cipher.final("base64");

  return `${initVector.toString("base64")};${encrypted}`;
}
