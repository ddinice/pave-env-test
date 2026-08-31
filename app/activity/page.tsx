import { redirect } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { currentUser } from "../../lib/auth/current-user";
import { listAnalysisModelOptions } from "../../lib/analysis-models/repository";
import {
  listChangeAuthors,
  listDesignVariableHistoryFeed,
} from "../../lib/design-variables/history-feed";
import type { HistoryFeedKindFilter } from "../../lib/design-variables/types";
import { ActivityFeed } from "./activity-feed";
import type { SearchParams } from "./types";

const validKinds: HistoryFeedKindFilter[] = ["all", "runs", "web"];

export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const kind = validKinds.includes(params.kind as HistoryFeedKindFilter)
    ? (params.kind as HistoryFeedKindFilter)
    : "all";

  const [page, authors, models] = await Promise.all([
    listDesignVariableHistoryFeed({ kind, userId: params.userId, modelId: params.modelId }),
    listChangeAuthors(),
    listAnalysisModelOptions(),
  ]);

  return (
    <AppShell userName={user.name}>
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading">Activity</h2>
        <p className="external-key">Every change to the registry, newest first</p>
        <ActivityFeed
          authors={authors}
          initialPage={page}
          kind={kind}
          modelId={params.modelId ?? ""}
          models={models}
          userId={params.userId ?? ""}
        />
      </section>
    </AppShell>
  );
}
