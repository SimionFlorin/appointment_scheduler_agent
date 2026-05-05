import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * AES-256-GCM encrypt. Returns `iv:authTag:ciphertext` (all hex).
 * Plaintext values (pre-encryption migration) won't match this format,
 * so `decrypt()` can detect and pass them through.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * AES-256-GCM decrypt. Expects the `iv:authTag:ciphertext` format from `encrypt()`.
 * If the value doesn't match that format (e.g. a legacy plaintext token),
 * returns it as-is so existing unencrypted rows keep working.
 */
export function decrypt(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts.some((p) => !/^[0-9a-f]+$/i.test(p))) {
    return stored;
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    return stored;
  }

  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex"),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
