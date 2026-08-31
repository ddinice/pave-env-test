export type AnalysisModelListItem = {
  id: string;
  slug: string;
  name: string;
};

export type AnalysisModelItemRecord = {
  variableId: string;
  externalKey: string;
  name: string;
  position: number;
};

export type AnalysisModelDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  owner: { id: string; name: string } | null;
  lastRunAt: Date | null;
  pullItems: AnalysisModelItemRecord[];
  pushItems: AnalysisModelItemRecord[];
};

export type AnalysisModelSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string } | null;
  pullCount: number;
  pushCount: number;
  lastRunAt: Date | null;
};

export type AnalysisModelInfo = {
  name: string;
  description: string | null;
  ownerId: string;
};

export type ModelItemsInput = {
  pullVariableIds: string[];
  pushVariableIds: string[];
};

export type CreateAnalysisModel = AnalysisModelInfo & ModelItemsInput;

export type CreatedAnalysisModel = {
  id: string;
  slug: string;
};

export type UpdateAnalysisModel = {
  id: string;
  name: string;
  description: string | null;
} & ModelItemsInput;

export type ModelPullVariable = {
  externalKey: string;
  value: string;
};

export type ModelAccess = {
  ownerId: string | null;
};

export type UserAccess = {
  id: string;
};