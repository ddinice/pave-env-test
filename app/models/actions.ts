"use server";

import { redirect } from "next/navigation";

import { currentUser } from "../../lib/auth/current-user";
import { canEditModel } from "../../lib/analysis-models/policy";
import {
  createAnalysisModel,
  deleteAnalysisModel,
  findAnalysisModelBySlug,
  updateAnalysisModel,
} from "../../lib/analysis-models/repository";
import { modelFormSchema, type ModelFormValues } from "../../lib/analysis-models/schemas";
import type { ModelFormInput } from "./types";

function parseModelForm(input: ModelFormInput): ModelFormValues {
  const parsed = modelFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  }
  return parsed.data;
}

export async function createModel(
  input: ModelFormInput,
): Promise<{ slug: string }> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const values = parseModelForm(input);

  return createAnalysisModel({
    name: values.name,
    description: values.description || null,
    ownerId: user.id,
    pullVariableIds: values.pullVariableIds,
    pushVariableIds: values.pushVariableIds,
  });
}

export async function updateModel(
  slug: string,
  input: ModelFormInput,
): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const model = await findAnalysisModelBySlug(slug);
  if (!model) throw new Error("This model no longer exists.");
  // could be enabled in the future
  // if (!canEditModel(user, model))
  //   throw new Error("Only the owner can edit this model.");

  const values = parseModelForm(input);

  await updateAnalysisModel({
    id: model.id,
    name: values.name,
    description: values.description || null,
    pullVariableIds: values.pullVariableIds,
    pushVariableIds: values.pushVariableIds,
  });
}

export async function deleteModel(slug: string): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const model = await findAnalysisModelBySlug(slug);
  if (!model) return;
  if (!canEditModel(user, model))
    throw new Error("Only the owner can delete this model.");

  await deleteAnalysisModel(model.id);
}
