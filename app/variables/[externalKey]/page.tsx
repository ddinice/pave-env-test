import { notFound, redirect } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { DesignVariableEditor } from "../../../components/design-variable-editor";
import { Badge } from "../../../components/ui/badge";
import { canEditVariable } from "../../../lib/auth/policy";
import { currentUser } from "../../../lib/auth/current-user";
import { findDesignVariableByExternalKey } from "../../../lib/design-variables/repository";

type SearchParams = Promise<{ saved?: string }>;

export default async function VariableDetailPage({ params, searchParams }: { params: Promise<{ externalKey: string }>; searchParams: SearchParams }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { externalKey } = await params;
  const { saved } = await searchParams;
  const variable = await findDesignVariableByExternalKey(externalKey);
  if (!variable) notFound();

  const editable = canEditVariable(user, variable);
  return (
    <AppShell userName={user.name}>
      <a className="back-link" href="/variables">← All variables</a>
      <section className="variable-detail" aria-labelledby="variable-heading">
        <div className="variable-primary"><p className="eyebrow">{variable.subsystem}</p><h1 id="variable-heading">{variable.name}</h1><p className="external-key" translate="no">{variable.externalKey}</p><div className="current-value"><span>Current value</span><strong>{variable.value} <small>{variable.unit}</small></strong></div></div>
        <aside className="variable-context" aria-label="Variable context">
          {variable.isProtected ? <Badge className="status-badge">Protected</Badge> : <span className="standard-access">Standard access</span>}
          <dl className="metadata"><div><dt>Description</dt><dd>{variable.description}</dd></div><div><dt>Last updated</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(variable.updatedAt)}</dd></div></dl>
        </aside>
      </section>
      {saved === "1" ? <p className="save-notice" role="status">Changes saved.</p> : null}
      {editable ? <section className="edit-panel" aria-labelledby="edit-heading"><div><p className="eyebrow">Manual update</p><h2 id="edit-heading">Edit value</h2><p>Changes update the registry immediately and record you as the editor.</p></div><DesignVariableEditor externalKey={variable.externalKey} unit={variable.unit} value={variable.value} /></section> : <section className="permission-notice" aria-label="Protected variable access"><Badge className="status-badge">Protected</Badge><p>This is a protected variable. Only an Engineering Lead can edit it.</p></section>}
    </AppShell>
  );
}
