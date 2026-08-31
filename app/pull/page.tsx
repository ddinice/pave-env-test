import { redirect } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { currentUser } from "../../lib/auth/current-user";
import { listAnalysisModelOptions } from "../../lib/analysis-models/repository";
import { PullWorkspace } from "./pull-workspace";

export default async function PullPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const models = await listAnalysisModelOptions();

  return (
    <AppShell userName={user.name}>
      <section aria-labelledby="pull-heading">
        <h2 id="pull-heading">Pull Variables</h2>
        <p>Paste your input file, get it back filled</p>
        <PullWorkspace models={models} />
      </section>
    </AppShell>
  );
}
