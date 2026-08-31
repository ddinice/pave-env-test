"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Input } from "./ui/input";
import type { Sort } from "./types";

export function RegistryFilters({
  query,
  sort,
  subsystem,
  subsystems,
  isPending,
  onNavigate,
}: {
  query: string;
  sort: Sort;
  subsystem: string;
  subsystems: string[];
  isPending: boolean;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingFilter, setPendingFilter] = useState<"query" | "subsystem" | "sort" | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    setPendingFilter(null);
    setSearchQuery(query);
  }, [query, sort, subsystem]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchQuery === query) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set("query", searchQuery);
      else params.delete("query");
      setPendingFilter("query");
      onNavigate(params.size ? `${pathname}?${params}` : pathname);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [onNavigate, pathname, query, searchParams, searchQuery]);

  function updateFilter(name: "subsystem" | "sort", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    setPendingFilter(name);
    onNavigate(params.size ? `${pathname}?${params}` : pathname);
  }

  return (
    <div className="filters">
      <label>
        <span className="sr-only">Search variables</span>
        <Input aria-busy={isPending && pendingFilter === "query"} disabled={isPending && pendingFilter === "query"} name="query" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Variables" type="search" value={searchQuery} />
      </label>
      <label>
        <span className="sr-only">Filter by subsystem</span>
        <select aria-busy={isPending && pendingFilter === "subsystem"} aria-label="Filter by subsystem" className="filter-select filter-select-subsystem" disabled={isPending && pendingFilter === "subsystem"} name="subsystem" onChange={(event) => updateFilter("subsystem", event.target.value)} value={subsystem}>
          <option value="">All subsystems</option>
          {subsystems.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Sort variables</span>
        <select aria-busy={isPending && pendingFilter === "sort"} aria-label="Sort variables" className="filter-select filter-select-sort" disabled={isPending && pendingFilter === "sort"} name="sort" onChange={(event) => updateFilter("sort", event.target.value)} value={sort}>
          <option value="name">Name</option>
          <option value="subsystem">Subsystem</option>
          <option value="updatedAt">Recently updated</option>
        </select>
      </label>
    </div>
  );
}
