import { createDecipheriv, scryptSync } from "node:crypto";
import { ALGORITHM } from "./encryptValue.js";

export function decryptValue(encrypted: string, secret: string) {
  const [initVectorAsBase64, value] = encrypted.split(";");

  const initVector = Buffer.from(initVectorAsBase64, "base64");
  const key = scryptSync(secret, "salt", 24);
  const decipher = createDecipheriv(ALGORITHM, key, initVector);

  return decipher.update(value, "base64", "utf8") + decipher.final("utf8");
}
