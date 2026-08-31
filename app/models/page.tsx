import { redirect } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { currentUser } from "../../lib/auth/current-user";
import { listAnalysisModels } from "../../lib/analysis-models/repository";
import { formatAbsoluteDate } from "../../lib/utils";

export default async function ModelsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const models = await listAnalysisModels();

  return (
    <AppShell userName={user.name}>
      <section aria-labelledby="models-heading">
        <div className="registry-toolbar">
          <div>
            <h2 id="models-heading">Analysis Models</h2>
            <p className="external-key">Everyone can see every model — only its owner can edit it.</p>
          </div>
          <a className="button" href="/models/new">
            New model
          </a>
        </div>

        {models.length > 0 ? (
          <table className="table">
            <caption className="sr-only">Analysis models</caption>
            <tbody>
              {models.map((model) => (
                <tr className="variable-row" key={model.id}>
                  <th scope="row">
                    <a className="variable-link" href={`/models/${model.slug}`}>
                      <span>{model.name}</span>
                      {model.description ? <span className="variable-subsystem">› {model.description}</span> : null}
                    </a>
                  </th>
                  <td className="unit">{model.pullCount} pull</td>
                  <td className="unit">{model.pushCount} push</td>
                  <td className="unit">
                    {model.lastRunAt ? formatAbsoluteDate(model.lastRunAt) : "Never run"}
                  </td>
                  <td className="unit">{model.owner?.name ?? "No owner"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <section className="empty-state" aria-labelledby="empty-state-heading">
            <p className="eyebrow">No models yet</p>
            <h2 id="empty-state-heading">Create your first analysis model</h2>
            <p>Group the variables an analysis pulls and pushes so you can reuse the mapping.</p>
            <a className="button button-secondary" href="/models/new">
              New model
            </a>
          </section>
        )}
      </section>
    </AppShell>
  );
}
