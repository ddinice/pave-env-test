import type { TextLine, FillStats } from "./types";

export function entryLines(lines: TextLine[]): { key: string; value: string }[] {
  return lines
    .filter(
      (line): line is Extract<TextLine, { type: "entry" }> =>
        line.type === "entry",
    )
    .map((line) => ({ key: line.key, value: line.value }));
}

/**
 * Returns:
 * type: "raw" - when the line is a comment or isnot a valid key-value pair,
 * type: "entry" - when the line is a key-value pair, and type.
 */
export function parseEnv(text: string): TextLine[] {
  return text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      return { type: "raw", text: line };
    }

    const withValue = /^([^=\s][^=]*?)=(.*)$/.exec(line);
    if (withValue)
      return { type: "entry", key: withValue[1].trim(), value: withValue[2] };

    const bareKey = /^[A-Za-z0-9_.-]+$/.exec(trimmed);
    if (bareKey) return { type: "entry", key: trimmed, value: "" };

    return { type: "raw", text: line };
  });
}

export function fillEnv(
  lines: TextLine[],
  values: Record<string, { value: string; subsystem: string }>,
  formatted = false,
): { output: string; stats: FillStats } {
  const notFound: string[] = [];
  const stale: string[] = [];
  let filled = 0;
  let total = 0;

  function match(line: Extract<TextLine, { type: "entry" }>) {
    total += 1;
    const found = values[line.key];
    if (found === undefined) {
      notFound.push(line.key);
      return null;
    }

    filled += 1;
    if (line.value.trim() !== "" && line.value.trim() !== found.value) {
      stale.push(line.key);
    }
    return found;
  }

  if (!formatted) {
    const output = lines
      .map((line) => {
        if (line.type === "raw") return line.text;

        const found = match(line);
        if (!found) return `#${line.key}=${line.value}`;
        return `${line.key}=${found.value}`;
      })
      .join("\n");

    return { output, stats: { total, filled, notFound, stale } };
  }

  const unmatched: string[] = [];
  const groups = new Map<string, string[]>();

  for (const line of lines) {
    if (line.type === "raw") continue;

    const found = match(line);
    if (!found) {
      unmatched.push(`#${line.key}=${line.value}`);
      continue;
    }

    const entries = groups.get(found.subsystem) ?? [];
    entries.push(`${line.key}=${found.value}`);
    groups.set(found.subsystem, entries);
  }

  const sections = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subsystem, entries]) => [`#${subsystem}`, ...entries].join("\n"));

  if (unmatched.length > 0) {
    sections.push(["# Not found", ...unmatched].join("\n"));
  }

  return {
    output: sections.join("\n\n"),
    stats: { total, filled, notFound, stale },
  };
}
