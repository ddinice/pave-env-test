import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

const nextHeaders = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: nextHeaders.cookies }));

import {
  createSessionToken,
  endSession,
  getSessionUserId,
  SESSION_COOKIE_NAME,
} from "../../lib/auth/session";

const originalSessionSecret = process.env.SESSION_SECRET;
const sessionSecret = "unit-test-session-secret";

describe("session handling", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = sessionSecret;
    nextHeaders.cookies.mockResolvedValue({ set: nextHeaders.cookieSet });
  });

  afterEach(() => {
    if (originalSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSessionSecret;
    vi.clearAllMocks();
  });

  it("returns the user id from a valid signed session", async () => {
    const token = await createSessionToken("user-123");

    await expect(getSessionUserId(token)).resolves.toBe("user-123");
  });

  it("rejects a tampered session token", async () => {
    const token = await createSessionToken("user-123");
    const [header, payload, signature] = token.split(".");
    const tampered = `${header}.${payload}.${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;

    await expect(getSessionUserId(tampered)).resolves.toBeNull();
  });

  it("rejects an expired session token", async () => {
    const token = await new SignJWT({ userId: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("0s")
      .sign(new TextEncoder().encode(sessionSecret));

    await expect(getSessionUserId(token)).resolves.toBeNull();
  });

  it("surfaces a missing session secret as a configuration error", async () => {
    const token = await createSessionToken("user-123");
    delete process.env.SESSION_SECRET;

    await expect(getSessionUserId(token)).rejects.toThrow("SESSION_SECRET must be configured.");
  });

  it("surfaces a missing session secret even when no cookie is present", async () => {
    delete process.env.SESSION_SECRET;

    await expect(getSessionUserId(undefined)).rejects.toThrow("SESSION_SECRET must be configured.");
  });

  it("expires the session using the same cookie name and scope", async () => {
    await endSession();

    expect(nextHeaders.cookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({
        expires: new Date(0),
        httpOnly: true,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      }),
    );
  });
});
