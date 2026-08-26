import { redirect } from "next/navigation";

import { currentUser } from "../lib/auth/current-user";

/**
 * Sends visitors to the registry only after the signed session and database user
 * lookup have both succeeded.
 */
export default async function HomePage() {
  const user = await currentUser();

  redirect(user ? "/variables" : "/login");
}
