import { redirect } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { currentUser } from "../../../lib/auth/current-user";
import { listDesignVariablesForPicker } from "../../../lib/design-variables/repository";
import { ModelForm } from "../model-form";

export default async function NewModelPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const allVariables = await listDesignVariablesForPicker();

  return (
    <AppShell userName={user.name}>
      <a className="back-link" href="/models">
        ← All models
      </a>
      <p className="eyebrow">New model</p>
      <ModelForm allVariables={allVariables} />
    </AppShell>
  );
}