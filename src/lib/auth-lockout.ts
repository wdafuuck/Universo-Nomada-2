/** Bloqueo tras intentos fallidos de autenticación (login con contraseña). */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const attemptBuckets = new Map<string, { count: number; resetAt: number }>();
const lockoutUntil = new Map<string, number>();

export function authLockKey(kind: "email" | "ip", value: string): string {
  return `auth-lock:${kind}:${value}`;
}

export function isAuthLocked(key: string): { locked: boolean; retryAfterSec: number } {
  const until = lockoutUntil.get(key);
  if (until && Date.now() < until) {
    return { locked: true, retryAfterSec: Math.ceil((until - Date.now()) / 1000) };
  }
  if (until) lockoutUntil.delete(key);
  return { locked: false, retryAfterSec: 0 };
}

export function recordAuthFailure(key: string): {
  locked: boolean;
  retryAfterSec: number;
  attemptsLeft: number;
} {
  const existingLock = isAuthLocked(key);
  if (existingLock.locked) {
    return { locked: true, retryAfterSec: existingLock.retryAfterSec, attemptsLeft: 0 };
  }

  const now = Date.now();
  const entry = attemptBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    attemptBuckets.set(key, { count: 1, resetAt: now + LOCKOUT_MS });
    return { locked: false, retryAfterSec: 0, attemptsLeft: MAX_ATTEMPTS - 1 };
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    lockoutUntil.set(key, now + LOCKOUT_MS);
    attemptBuckets.delete(key);
    return { locked: true, retryAfterSec: Math.ceil(LOCKOUT_MS / 1000), attemptsLeft: 0 };
  }

  return { locked: false, retryAfterSec: 0, attemptsLeft: MAX_ATTEMPTS - entry.count };
}

export function clearAuthFailures(key: string): void {
  attemptBuckets.delete(key);
  lockoutUntil.delete(key);
}

export function checkLoginLockout(
  email: string,
  ip: string,
): { locked: boolean; retryAfterSec: number } {
  const emailLock = isAuthLocked(authLockKey("email", email));
  if (emailLock.locked) return emailLock;
  return isAuthLocked(authLockKey("ip", ip));
}

export function recordLoginFailure(
  email: string,
  ip: string,
): { locked: boolean; retryAfterSec: number } {
  const emailResult = recordAuthFailure(authLockKey("email", email));
  const ipResult = recordAuthFailure(authLockKey("ip", ip));
  if (emailResult.locked) return { locked: true, retryAfterSec: emailResult.retryAfterSec };
  if (ipResult.locked) return { locked: true, retryAfterSec: ipResult.retryAfterSec };
  return { locked: false, retryAfterSec: 0 };
}

export function clearLoginLockout(email: string, ip: string): void {
  clearAuthFailures(authLockKey("email", email));
  clearAuthFailures(authLockKey("ip", ip));
}

/** Solo para tests. */
export function resetAuthLockoutState(): void {
  attemptBuckets.clear();
  lockoutUntil.clear();
}
