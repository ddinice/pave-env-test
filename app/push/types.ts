export type PushRowState = "will-change" | "unchanged" | "protected";

export type PushRow = {
  externalKey: string;
  incomingValue: string;
  currentValue: string;
  unit: string;
  updatedAt: Date;
  updatedByName: string | null;
  isProtected: boolean;
  state: PushRowState;
};

export type PushReview = {
  rows: PushRow[];
  notFound: string[];
};

export type PushRegistryRow = {
  externalKey: string;
  value: string;
  unit: string;
  isProtected: boolean;
  updatedAt: Date;
  updatedByUser: { name: string } | null;
};
