import type { EnvMatch, FillStats, TextLine } from "./types";

export function parseJson(text: string): TextLine[] {
  const lines: TextLine[] = [];

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (node === null || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      if (value !== null && typeof value === "object") {
        walk(value);
        continue;
      }

      lines.push({
        type: "entry",
        key,
        value: value === null ? "" : String(value),
      });
    }
  };

  walk(JSON.parse(text));
  return lines;
}

export function entryJsonLines(
  lines: TextLine[],
): { key: string; value: string }[] {
  return lines
    .filter(
      (line): line is Extract<TextLine, { type: "entry" }> =>
        line.type === "entry",
    )
    .map((line) => ({ key: line.key, value: line.value }));
}

export function validateJson(text: string): { valid: boolean; error?: string } {
  if (!text) return { valid: false, error: "Empty JSON" };
  return JSON.parse(JSON.stringify(text))
    ? { valid: true }
    : { valid: false, error: "Invalid JSON" };
}

export function fillJson(
  text: string,
  values: Record<string, EnvMatch>,
): { output: string; stats: FillStats } {
  const notFound: string[] = [];
  const stale: string[] = [];
  let filled = 0;
  let total = 0;

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);

    if (node !== null && typeof node === "object") {
      return Object.fromEntries(
        Object.entries(node).map(([key, value]) => {
          if (value !== null && typeof value === "object") {
            return [key, walk(value)];
          }

          total += 1;
          const found = values[key];
          if (found === undefined) {
            notFound.push(key);
            return [key, value];
          }

          filled += 1;
          const original = value === null ? "" : String(value);
          if (original !== "" && original !== found.value) {
            stale.push(key);
          }

          return [key, coerce(found.value, value)];
        }),
      );
    }

    return node;
  };

  const filledTree = walk(JSON.parse(text));
  const output = text.includes("\n")
    ? JSON.stringify(filledTree, null, detectIndent(text)) +
      (text.endsWith("\n") ? "\n" : "")
    : JSON.stringify(filledTree);

  return { output, stats: { total, filled, notFound, stale } };
}

function coerce(next: string, original: unknown): string | number {
  if (typeof original === "number") {
    const parsed = Number(next);
    return Number.isNaN(parsed) ? next : parsed;
  }
  return next;
}

function detectIndent(text: string): string | number {
  const match = text.match(/\n([ \t]+)"/);
  if (!match) return 2;
  return match[1].includes("\t") ? "\t" : match[1].length;
}
