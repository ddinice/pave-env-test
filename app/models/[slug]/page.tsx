import { notFound, redirect } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { currentUser } from "../../../lib/auth/current-user";
import { formatRelativeTime } from "../../../lib/utils";
import { canEditModel } from "../../../lib/analysis-models/policy";
import { findAnalysisModelBySlug } from "../../../lib/analysis-models/repository";
import { listDesignVariablesForPicker } from "../../../lib/design-variables/repository";
import { ModelForm } from "../model-form";

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const model = await findAnalysisModelBySlug(slug);
  if (!model) notFound();

  const editable = canEditModel(user, model);
  const allVariables = await listDesignVariablesForPicker(model.id);

  return (
    <AppShell userName={user.name}>
      <a className="back-link" href="/models">
        ← All models
      </a>

      <ModelForm
        allVariables={allVariables}
        initial={{
          name: model.name,
          description: model.description ?? "",
          pullIds: model.pullItems.map((item) => item.variableId),
          pushIds: model.pushItems.map((item) => item.variableId),
        }}
        editable={editable}
        meta={{
          owner: model.owner?.name ?? null,
          lastRunLabel: model.lastRunAt
            ? `last run ${formatRelativeTime(model.lastRunAt)}`
            : "never run",
        }}
        slug={model.slug}
      />
    </AppShell>
  );
}
