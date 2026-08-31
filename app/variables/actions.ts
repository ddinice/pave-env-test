"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { currentUser } from "../../lib/auth/current-user";
import { listDesignVariableHistory } from "../../lib/design-variables/history";
import type { DesignVariableHistoryPage } from "../../lib/design-variables/types";
import { updateDesignVariable } from "../../lib/design-variables/service";
import type { ManualEditState } from "./types";

export async function updateVariable(_: ManualEditState, formData: FormData): Promise<ManualEditState> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const externalKey = formData.get("externalKey");
  if (typeof externalKey !== "string" || externalKey.length === 0) return { error: "The variable could not be identified." };

  const result = await updateDesignVariable({
    externalKey,
    input: { value: formData.get("value"), unit: formData.get("unit") },
    user,
  });

  if (result.status === "validation") return { fieldErrors: result.fieldErrors };
  if (result.status === "not-found") return { error: "This variable no longer exists." };
  if (result.status === "forbidden") return { error: "You do not have permission to edit this variable." };

  revalidatePath("/variables");
  return { status: "updated" };
}

export async function loadDesignVariableHistory(
  externalKey: string,
  cursor?: string,
): Promise<DesignVariableHistoryPage> {
  const user = await currentUser();
  if (!user) redirect("/login");

  return listDesignVariableHistory({ externalKey, cursor });
}
