import { db } from "../db";
import { generateUniqueSlug } from "./slug";
import type {
  AnalysisModelDetail,
  AnalysisModelItemRecord,
  AnalysisModelListItem,
  AnalysisModelSummary,
  CreateAnalysisModel,
  CreatedAnalysisModel,
  ModelItemsInput,
  ModelPullVariable,
  UpdateAnalysisModel,
} from "./types";

export async function listAnalysisModels(): Promise<AnalysisModelSummary[]> {
  const models = await db.analysisModel.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: { select: { id: true, name: true } },
      items: { select: { direction: true } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return models.map((model) => ({
    id: model.id,
    slug: model.slug,
    name: model.name,
    description: model.description,
    owner: model.owner,
    pullCount: model.items.filter((item) => item.direction === "PULL").length,
    pushCount: model.items.filter((item) => item.direction === "PUSH").length,
    lastRunAt: model.runs[0]?.createdAt ?? null,
  }));
}

export function listAnalysisModelOptions(): Promise<AnalysisModelListItem[]> {
  return db.analysisModel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

export async function findAnalysisModelBySlug(
  slug: string,
): Promise<AnalysisModelDetail | null> {
  const model = await db.analysisModel.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          variable: { select: { id: true, externalKey: true, name: true } },
        },
      },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  if (!model) return null;

  const toItem = (
    item: (typeof model.items)[number],
  ): AnalysisModelItemRecord => ({
    variableId: item.variable.id,
    externalKey: item.variable.externalKey,
    name: item.variable.name,
    position: item.position,
  });

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    description: model.description,
    ownerId: model.ownerId,
    owner: model.owner,
    lastRunAt: model.runs[0]?.createdAt ?? null,
    pullItems: model.items
      .filter((item) => item.direction === "PULL")
      .map(toItem),
    pushItems: model.items
      .filter((item) => item.direction === "PUSH")
      .map(toItem),
  };
}

function itemRows(
  modelId: string,
  { pullVariableIds, pushVariableIds }: ModelItemsInput,
) {
  return [
    ...pullVariableIds.map((variableId, position) => ({
      modelId,
      variableId,
      direction: "PULL" as const,
      position,
    })),
    ...pushVariableIds.map((variableId, position) => ({
      modelId,
      variableId,
      direction: "PUSH" as const,
      position,
    })),
  ];
}

export async function createAnalysisModel({
  name,
  description,
  ownerId,
  pullVariableIds,
  pushVariableIds,
}: CreateAnalysisModel): Promise<CreatedAnalysisModel> {
  const slug = await generateUniqueSlug(name, async (candidate) => {
    const existing = await db.analysisModel.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return existing !== null;
  });

  const model = await db.analysisModel.create({
    data: { slug, name, description, ownerId },
  });

  const rows = itemRows(model.id, { pullVariableIds, pushVariableIds });
  if (rows.length > 0) await db.analysisModelItem.createMany({ data: rows });

  return { id: model.id, slug: model.slug };
}

export async function updateAnalysisModel({
  id,
  name,
  description,
  pullVariableIds,
  pushVariableIds,
}: UpdateAnalysisModel): Promise<void> {
  const rows = itemRows(id, { pullVariableIds, pushVariableIds });

  await db.$transaction([
    db.analysisModel.update({ where: { id }, data: { name, description } }),
    db.analysisModelItem.deleteMany({ where: { modelId: id } }),
    ...(rows.length > 0
      ? [db.analysisModelItem.createMany({ data: rows })]
      : []),
  ]);
}

export async function deleteAnalysisModel(id: string): Promise<void> {
  await db.analysisModel.delete({ where: { id } });
}

export function listModelPullVariables(
  modelId: string,
): Promise<ModelPullVariable[]> {
  return db.analysisModelItem
    .findMany({
      where: { modelId, direction: "PULL" },
      orderBy: { position: "asc" },
      include: { variable: { select: { externalKey: true, value: true } } },
    })
    .then((items) =>
      items.map((item) => ({
        externalKey: item.variable.externalKey,
        value: item.variable.value,
      })),
    );
}
