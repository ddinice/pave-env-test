"use client";

import { useMemo, useState, useTransition } from "react";

import { fillEnvValues } from "./actions";
import { entryLines, fillEnv, parseEnv } from "./env";
import type { EnvLine, EnvMatch, FillStats } from "./types";

export function useEnvFiller() {
  const [text, setText] = useState("");
  const [formatted, setFormatted] = useState(false);
  const [fetched, setFetched] = useState<{
    lines: EnvLine[];
    values: Record<string, EnvMatch>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function fill() {
    const lines = parseEnv(text);
    const keys = entryLines(lines).map((entry) => entry.key);

    startTransition(async () => {
      const values = await fillEnvValues(keys);
      setFetched({ lines, values });
    });
  }

  const { output, stats } = useMemo(() => {
    if (!fetched) return { output: "", stats: null as FillStats | null };
    return fillEnv(fetched.lines, fetched.values, formatted);
  }, [fetched, formatted]);

  return { text, setText, fill, output, stats, isPending, formatted, setFormatted };
}
