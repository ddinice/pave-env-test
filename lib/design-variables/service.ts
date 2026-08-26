import { canEditVariable } from "../auth/policy";
import { findDesignVariableByExternalKey, updateDesignVariableValue } from "./repository";
import { manualValueSchema } from "./schemas";

type UpdateUser = {
  id: string;
  role: "ANALYST" | "ENGINEERING_LEAD";
};

export type UpdateDesignVariableResult =
  | { status: "updated"; variable: Awaited<ReturnType<typeof updateDesignVariableValue>> }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "validation"; fieldErrors: Record<string, string[] | undefined> };

export async function updateDesignVariable({
  externalKey,
  input,
  user,
}: {
  externalKey: string;
  input: unknown;
  user: UpdateUser;
}): Promise<UpdateDesignVariableResult> {
  const variable = await findDesignVariableByExternalKey(externalKey);

  if (!variable) return { status: "not-found" };
  if (!canEditVariable(user, variable)) return { status: "forbidden" };

  const parsedValue = manualValueSchema.safeParse(input);
  if (!parsedValue.success) return { status: "validation", fieldErrors: parsedValue.error.flatten().fieldErrors };

  const updated = await updateDesignVariableValue({
    externalKey,
    value: parsedValue.data,
    updatedByUserId: user.id,
  });

  return { status: "updated", variable: updated };
}
