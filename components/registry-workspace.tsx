"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

import type { DesignVariableRecord } from "../lib/design-variables/types";
import { DesignVariableDrawer } from "./DesignVariableDrawer/design-variable-drawer";
import { RegistryFilters } from "./registry-filters";
import type { Sort } from "./types";

export function RegistryWorkspace({
  query,
  sort,
  subsystem,
  subsystems,
  userRole,
  variables,
}: {
  query: string;
  sort: Sort;
  subsystem: string;
  subsystems: string[];
  userRole: "ANALYST" | "ENGINEERING_LEAD";
  variables: DesignVariableRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const resultLabel = `${variables.length} ${variables.length === 1 ? "variable" : "variables"}`;

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => router.replace(href));
    },
    [router],
  );

  return (
    <section
      aria-busy={isPending}
      aria-label="Design variables"
      className="registry-workspace"
      data-pending={isPending || undefined}
    >
      <div className="registry-toolbar">
        <RegistryFilters
          isPending={isPending}
          onNavigate={navigate}
          query={query}
          sort={sort}
          subsystem={subsystem}
          subsystems={subsystems}
        />
        <p aria-live="polite" className="result-count">
          {resultLabel}
        </p>
      </div>
      <div className="registry-results">
        {variables.length > 0 ? (
          <DesignVariableDrawer userRole={userRole} variables={variables} />
        ) : (
          <section
            className="empty-state"
            aria-labelledby="empty-state-heading"
          >
            <p className="eyebrow">No matching records</p>
            <h2 id="empty-state-heading">No variables found</h2>
            <p>Try a different search term or remove the active filters.</p>
            <a className="button button-secondary" href="/variables">
              Clear filters
            </a>
          </section>
        )}
      </div>
    </section>
  );
}
