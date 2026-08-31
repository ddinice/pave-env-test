import type { Prisma } from "@prisma/client";

export type DesignVariableRecord = {
  externalKey: string;
  name: string;
  value: string;
  unit: string;
  subsystem: string;
  description: string;
  isProtected: boolean;
  updatedAt: Date;
};

export type ListDesignVariablesOptions = {
  query?: string;
  subsystem?: string;
  sort?: "name" | "subsystem" | "updatedAt";
};

export type DesignVariableReviewRecord = {
  externalKey: string;
  name: string;
  value: string;
  unit: string;
  isProtected: boolean;
  updatedAt: Date;
  updatedByUser: { name: string } | null;
};

export type DesignVariablePickerOption = {
  id: string;
  externalKey: string;
  name: string;
  subsystem: string;
  isProtected: boolean;
  modelCount: number;
};

export type DesignVariableHistoryEntry = Prisma.DesignChangeHistoryGetPayload<{
  include: { changedByUser: { select: { name: true } } };
}>;

export type DesignVariableHistoryPage = {
  items: DesignVariableHistoryEntry[];
  nextCursor: string | null;
};

export type WorkflowRunDetail = Prisma.WorkflowRunGetPayload<{
  include: {
    user: { select: { name: true } };
    model: { select: { slug: true; name: true } };
    changes: {
      include: {
        variable: { select: { externalKey: true; name: true } };
        changedByUser: { select: { name: true } };
      };
    };
  };
}>;

export type GroupRow = {
  groupId: string;
  runId: string | null;
  latestAt: Date;
  changeCount: number;
};

export type HistoryFeedEntry =
  | {
      kind: "run";
      runId: string;
      createdAt: Date;
      changeCount: number;
      source: string;
      label: string | null;
      model: { id: string; slug: string; name: string } | null;
      user: { id: string; name: string } | null;
      subsystems: string[];
      sampleChanges: {
        id: string;
        externalKey: string;
        oldValue: string | null;
        newValue: string | null;
      }[];
    }
  | {
      kind: "change";
      id: string;
      createdAt: Date;
      changeCount: number;
      source: string;
      field: string | null;
      oldValue: string | null;
      newValue: string | null;
      variable: { externalKey: string; name: string } | null;
      changedByUser: { id: string; name: string } | null;
    };

export type HistoryFeedPage = {
  items: HistoryFeedEntry[];
  nextCursor: string | null;
};

export type HistoryFeedKindFilter = "all" | "runs" | "web";

export type DesignVariableFieldName =
  | "value"
  | "unit"
  | "name"
  | "description"
  | "subsystem"
  | "isProtected";

export type DesignVariableChangeInput = Partial<{
  value: string;
  unit: string;
  name: string;
  description: string;
  subsystem: string;
  isProtected: boolean;
}>;

export type ChangeUser = {
  id: string;
  role: "ANALYST" | "ENGINEERING_LEAD";
};

export type DesignVariableRow = {
  id: string;
  externalKey: string;
  name: string;
  value: string;
  unit: string;
  subsystem: string;
  description: string;
  isProtected: boolean;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChangeDesignVariableResult =
  | { status: "unchanged"; variable: DesignVariableRow }
  | {
      status: "updated";
      variable: DesignVariableRow;
      changeSetId: string;
      changedFields: DesignVariableFieldName[];
    };

export type UpdateUser = {
  id: string;
  role: "ANALYST" | "ENGINEERING_LEAD";
};

export type UpdateDesignVariableResult =
  | { status: "updated"; variable: DesignVariableRow }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "validation"; fieldErrors: Record<string, string[] | undefined> };

export type PushUser = {
  id: string;
  role: "ANALYST" | "ENGINEERING_LEAD";
};

export type BulkPushUpdate = {
  externalKey: string;
  input: DesignVariableChangeInput;
};

export type BulkPushKeyResult =
  | {
      externalKey: string;
      status: "updated";
      changedFields: DesignVariableFieldName[];
    }
  | { externalKey: string; status: "unchanged" }
  | { externalKey: string; status: "protected" }
  | { externalKey: string; status: "not-found" };

export type BulkPushResult = {
  runId: string;
  results: BulkPushKeyResult[];
};
