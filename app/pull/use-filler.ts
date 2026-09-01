"use client";

import { useMemo, useState, useTransition } from "react";

import { fetchVariableValues } from "./actions";
import { entryLines, fillEnv, parseEnv } from "./env";
import { parseJson, validateJson, fillJson } from "./formatterJson";
import type { TextLine, EnvMatch, FillerType, FillStats } from "./types";

type PrepareResult = { lines: TextLine[]; keys: string[]; error?: string };

type FillFn = (
  text: string,
  lines: TextLine[],
  values: Record<string, EnvMatch>,
  formatted: boolean,
) => { output: string; stats: FillStats };

const EMPTY_STATS: FillStats = { total: 0, filled: 0, notFound: [], stale: [] };

const preparers: Record<FillerType, (text: string) => PrepareResult> = {
  env: (text) => {
    const lines = parseEnv(text);
    const keys = entryLines(lines).map((entry) => entry.key);
    return { lines, keys };
  },
  json: (text) => {
    const { valid, error } = validateJson(text);
    if (!valid) return { lines: [], keys: [], error };

    const lines = parseJson(text);
    const keys = entryLines(lines).map((entry) => entry.key);
    return { lines, keys };
  },
  csv: () => ({ lines: [], keys: [], error: "CSV parsing not implemented" }),
};

const fillers: Record<FillerType, FillFn> = {
  env: (_text, lines, values, formatted) => fillEnv(lines, values, formatted),
  json: (text, _lines, values) => fillJson(text, values),
  csv: () => ({ output: "", stats: EMPTY_STATS }),
};

export function useFiller() {
  const [text, setText] = useState("");
  const [formatted, setFormatted] = useState(false);
  const [fileType] = useState<FillerType>("json");
  const [isPending, startTransition] = useTransition();
  const [prepared, setPrepared] = useState<{
    text: string;
    lines: TextLine[];
    values: Record<string, EnvMatch>;
    fileType: FillerType;
  } | null>(null);

  function fill() {
    const { lines, keys, error } = preparers[fileType](text);
    if (error) return;

    const snapshot = text;

    startTransition(async () => {
      const values = await fetchVariableValues(keys);
      setPrepared({ text: snapshot, lines, values, fileType });
    });
  }

  const { output, stats } = useMemo(() => {
    if (!prepared) return { output: "", stats: null as FillStats | null };

    return fillers[prepared.fileType](
      prepared.text,
      prepared.lines,
      prepared.values,
      formatted,
    );
  }, [prepared, formatted]);

  return {
    text,
    setText,
    fill,
    output,
    stats,
    isPending,
    formatted,
    setFormatted,
  };
}
