export type TextLine =
  | { type: "raw"; text: string }
  | { type: "entry"; key: string; value: string };

export type FillStats = {
  total: number;
  filled: number;
  notFound: string[];
  stale: string[];
};

export type EnvMatch = { value: string; subsystem: string };

export type FillerType = "env" | "json" | "csv";
