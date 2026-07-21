import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }
  // Compatibilidad con hashes antiguos (base64) — migrar al iniciar sesión
  return Buffer.from(plain).toString("base64") === stored;
}

export function isLegacyPasswordHash(stored: string): boolean {
  return !!stored && !stored.startsWith("$2");
}
