import { redirect } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { RegistryWorkspace } from "../../components/registry-workspace";
import { currentUser } from "../../lib/auth/current-user";
import { listDesignVariables } from "../../lib/design-variables/repository";

type SearchParams = Promise<{ query?: string; subsystem?: string; sort?: string }>;
const validSorts = ["name", "subsystem", "updatedAt"] as const;

export default async function VariablesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sort = validSorts.includes(params.sort as (typeof validSorts)[number]) ? params.sort as (typeof validSorts)[number] : "name";
  const variables = await listDesignVariables({ query: params.query, subsystem: params.subsystem, sort });
  const subsystems = [...new Set(variables.map((variable) => variable.subsystem))].sort();

  return (
    <AppShell userName={user.name}>
      <RegistryWorkspace query={params.query ?? ""} sort={sort} subsystem={params.subsystem ?? ""} subsystems={subsystems} userRole={user.role} variables={variables} />
    </AppShell>
  );
}
