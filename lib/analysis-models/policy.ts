import { ModelAccess, UserAccess } from "./types";

export function canEditModel(
  user: UserAccess | null | undefined,
  model: ModelAccess,
): boolean {
  if (!user) return false;
  return model.ownerId === user.id;
}
