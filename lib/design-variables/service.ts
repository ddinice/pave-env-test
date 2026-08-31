import { canEditVariable } from "../auth/policy";
import { changeDesignVariable } from "./change-service";
import { ForbiddenVariableChangeError, VariableNotFoundError } from "./errors";
import { findDesignVariableByExternalKey } from "./repository";
import { manualValueSchema } from "./schemas";
import type { UpdateDesignVariableResult, UpdateUser } from "./types";

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

  try {
    const result = await changeDesignVariable({
      externalKey,
      input: { value: parsedValue.data.value, unit: parsedValue.data.unit },
      user,
      source: "WEB",
    });

    return { status: "updated", variable: result.variable };
  } catch (error) {
    if (error instanceof VariableNotFoundError) return { status: "not-found" };
    if (error instanceof ForbiddenVariableChangeError) return { status: "forbidden" };
    throw error;
  }
}
