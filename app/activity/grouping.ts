import type { HistoryFeedEntry } from "../../lib/design-variables/types";

const dayFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function dayLabel(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dayFormatter.format(date);
}

export function groupByDay(items: HistoryFeedEntry[]): { label: string; items: HistoryFeedEntry[] }[] {
  const groups: { label: string; items: HistoryFeedEntry[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function subsystemSummary(subsystems: string[]): string {
  if (subsystems.length === 0) return "";
  if (subsystems.length <= 2) return subsystems.join(", ");
  const rest = subsystems.length - 2;
  return `${subsystems.slice(0, 2).join(", ")} and ${rest} other subsystem${rest === 1 ? "" : "s"}`;
}
