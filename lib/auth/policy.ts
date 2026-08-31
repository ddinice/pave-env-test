import type { UserAccess, VariableAccess } from "./types";

export function canEditVariable(user: UserAccess | null | undefined, variable: VariableAccess): boolean {
  if (!user) return false;

  return !variable.isProtected || user.role === "ENGINEERING_LEAD";
}
