import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/env";

const COOKIE_NAME = "un_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

function secret() {
  return getSessionSecret();
}

function sign(payload: SessionUser): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string): SessionUser | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", secret()).update(data).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export function getSessionFromRequest(request: Request): SessionUser | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verify(decodeURIComponent(match[1]));
}

export async function requireAdmin(request?: Request): Promise<SessionUser | null> {
  const user = request ? getSessionFromRequest(request) : await getSession();
  if (!user || user.role !== "admin") return null;
  // Revalidar rol en DB (cookie puede quedar stale tras revocación)
  try {
    const { db } = await import("@/lib/db");
    const row = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true },
    });
    if (!row || row.role !== "admin") return null;
  } catch {
    return null;
  }
  return user;
}

export async function requireUser(request?: Request): Promise<SessionUser | null> {
  const user = request ? getSessionFromRequest(request) : await getSession();
  if (!user) return null;
  return user;
}
