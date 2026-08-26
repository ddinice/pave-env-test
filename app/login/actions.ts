"use server";

import { redirect } from "next/navigation";

import { startSession } from "../../lib/auth/session";
import { verifyPassword } from "../../lib/auth/password";
import { db } from "../../lib/db";

export type LoginState = {
  error?: string;
};

const invalidCredentials: LoginState = { error: "Invalid email or password." };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") return invalidCredentials;

  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) return invalidCredentials;

  await startSession(user.id);
  redirect("/variables");
}
