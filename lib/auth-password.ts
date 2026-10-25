import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const PREFIX = "scrypt:";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;
  return `${PREFIX}${salt.toString("base64")}.${derived.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (!passwordHash.startsWith(PREFIX)) {
    return false;
  }

  const payload = passwordHash.slice(PREFIX.length);
  const [saltB64, hashB64] = payload.split(".");
  if (!saltB64 || !hashB64) {
    return false;
  }

  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
