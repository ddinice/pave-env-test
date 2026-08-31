import { notFound, redirect } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { currentUser } from "../../../lib/auth/current-user";
import { getWorkflowRun } from "../../../lib/design-variables/history";
import { formatAbsoluteDate } from "../../../lib/utils";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { runId } = await params;
  const run = await getWorkflowRun(runId);
  if (!run) notFound();

  return (
    <AppShell userName={user.name}>
      <a className="back-link" href="/variables">
        ← All variables
      </a>
      <p className="eyebrow">{run.model ? run.model.name : (run.label ?? "Run")}</p>
      <h1>
        {run.changes.length} change{run.changes.length === 1 ? "" : "s"}
      </h1>
      <p className="external-key">
        {run.user.name} · {formatAbsoluteDate(run.createdAt)} · {run.source}
      </p>

      {run.changes.length > 0 ? (
        <table className="table">
          <caption className="sr-only">Changes in this run</caption>
          <tbody>
            {run.changes.map((change) => (
              <tr key={change.id}>
                <th scope="row">
                  <a href={`/variables/${change.variable.externalKey}`}>{change.variable.externalKey}</a>
                </th>
                <td>{change.field}</td>
                <td>{change.oldValue}</td>
                <td aria-hidden="true">→</td>
                <td>{change.newValue}</td>
                <td className="unit">{change.changedByUser?.name ?? "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <section className="empty-state" aria-labelledby="empty-state-heading">
          <p className="eyebrow">Nothing moved</p>
          <h2 id="empty-state-heading">This run made no changes</h2>
          <p>Every value in the batch already matched the registry.</p>
        </section>
      )}
    </AppShell>
  );
}
