import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "case_study_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SESSION_ALGORITHM = "HS256";

export const sessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) throw new Error("SESSION_SECRET must be configured.");

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: SESSION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionSecret());
}

export async function getSessionUserId(token: string | undefined): Promise<string | null> {
  const secret = sessionSecret();

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [SESSION_ALGORITHM] });
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function startSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionToken(userId), sessionCookieOptions);
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });
}
