import { describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  findUnique: vi.fn(),
  redirect: vi.fn(),
  startSession: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: { user: { findUnique: dependencies.findUnique } },
}));

vi.mock("../../lib/auth/session", () => ({ startSession: dependencies.startSession }));
vi.mock("../../lib/auth/password", () => ({ verifyPassword: dependencies.verifyPassword }));
vi.mock("next/navigation", () => ({ redirect: dependencies.redirect }));

import { login } from "../../app/login/actions";

describe("login", () => {
  const formData = new FormData();
  formData.set("email", "analyst@case-study.local");
  formData.set("password", "password");

  it("does not start a session when a known user's password is invalid", async () => {
    dependencies.findUnique.mockResolvedValue({ id: "user-123", passwordHash: "hash" });
    dependencies.verifyPassword.mockResolvedValue(false);

    await expect(login({}, formData)).resolves.toEqual({ error: "Invalid email or password." });
    expect(dependencies.startSession).not.toHaveBeenCalled();
  });

  it("does not start a session when credentials are invalid", async () => {
    dependencies.findUnique.mockResolvedValue(null);

    await expect(login({}, formData)).resolves.toEqual({ error: "Invalid email or password." });
    expect(dependencies.startSession).not.toHaveBeenCalled();
  });

  it("starts a session and redirects after valid credentials", async () => {
    dependencies.findUnique.mockResolvedValue({ id: "user-123", passwordHash: "hash" });
    dependencies.verifyPassword.mockResolvedValue(true);

    await login({}, formData);

    expect(dependencies.startSession).toHaveBeenCalledWith("user-123");
    expect(dependencies.redirect).toHaveBeenCalledWith("/variables");
  });
});
