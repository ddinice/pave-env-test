"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { currentUser } from "../../lib/auth/current-user";
import { updateDesignVariable } from "../../lib/design-variables/service";

export type ManualEditState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  status?: "updated";
};

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
