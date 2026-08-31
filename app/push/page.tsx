import { redirect } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { currentUser } from "../../lib/auth/current-user";
import { listAnalysisModelOptions } from "../../lib/analysis-models/repository";
import { PushWorkspace } from "./push-workspace";

export default async function PushPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const models = await listAnalysisModelOptions();

  return (
    <AppShell userName={user.name}>
      <section aria-labelledby="push-heading">
        <h2 id="push-heading">Push Variables</h2>
        <p>Paste the output file of your analysis and apply it to the registry.</p>
        <PushWorkspace canEditProtected={user.role === "ENGINEERING_LEAD"} models={models} />
      </section>
    </AppShell>
  );
}
