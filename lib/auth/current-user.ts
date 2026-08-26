import { cookies } from "next/headers";

import { db } from "../db";
import { getSessionUserId, SESSION_COOKIE_NAME } from "./session";

export async function currentUser() {
  const cookieStore = await cookies();
  const userId = await getSessionUserId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
}
