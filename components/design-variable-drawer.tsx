"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Drawer } from "vaul";

import { designVariablePublicId } from "../lib/design-variables/public-id";
import type { DesignVariableRecord } from "../lib/design-variables/repository";
import { DesignVariableEditor } from "./design-variable-editor";
import { DesignVariableTable } from "./design-variable-table";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

type UserRole = "ANALYST" | "ENGINEERING_LEAD";

export function DesignVariableDrawer({ userRole, variables }: { userRole: UserRole; variables: DesignVariableRecord[] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<"unit" | "value" | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedExternalKey, setSelectedExternalKey] = useState<string | null>(null);
  const variable = variables.find(({ externalKey }) => externalKey === selectedExternalKey) ?? null;
  const editable = Boolean(variable && (!variable.isProtected || userRole === "ENGINEERING_LEAD"));

  function closeDrawer() {
    setIsEditing(null);
    setHasUnsavedChanges(false);
    setSelectedExternalKey(null);
  }

  function openDrawer(externalKey: string) {
    setIsEditing(null);
    setHasUnsavedChanges(false);
    setSelectedExternalKey(externalKey);
  }

  function handleSaved() {
    toast.success("Design variable has been saved.");
    closeDrawer();
    router.refresh();
  }

  function notifyProtectedVariable() {
    toast.warning("You are not allowed to edit this variable.");
  }

  return (
    <>
      <DesignVariableTable onSelect={openDrawer} variables={variables} />
      <Drawer.Root direction="right" onOpenChange={(open) => { if (!open) closeDrawer(); }} open={variable !== null}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content" style={{ "--initial-transform": "calc(100% + 1rem)" } as CSSProperties}>
            {variable ? <section className="drawer-panel">
              <header className="drawer-header">
                <div>
                  <Drawer.Title className="drawer-title">{variable.name}</Drawer.Title>
                  <div className="drawer-identity"><p className="eyebrow">{variable.subsystem}</p><p className="external-key" translate="no">{designVariablePublicId(variable.externalKey)}</p></div>
                </div>
                <div className="drawer-header-actions">{!editable ? <Tooltip label="Protected variable"><span aria-label="Protected variable" className="drawer-protected-indicator" role="img"><svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><rect height="11" rx="2" width="14" x="5" y="11" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span></Tooltip> : hasUnsavedChanges ? <Tooltip label="Unsaved changes"><span aria-label="Unsaved changes" className="drawer-unsaved-indicator" role="status">!</span></Tooltip> : null}<button aria-label="Close variable details" className="drawer-close" onClick={closeDrawer} type="button">×</button></div>
              </header>

              <div className="drawer-body">
                <div className="drawer-current-value"><span>Current value</span>{editable && isEditing ? <DesignVariableEditor externalKey={variable.externalKey} formId={`variable-editor-${variable.externalKey}`} initialFocus={isEditing} inline onDirtyChange={setHasUnsavedChanges} onSaved={handleSaved} unit={variable.unit} value={variable.value} /> : <strong><button aria-disabled={!editable} aria-label={editable ? `Edit current number ${variable.value}` : `Current number ${variable.value}`} className="drawer-value-button" onClick={editable ? () => setIsEditing("value") : notifyProtectedVariable} type="button">{variable.value}</button> <button aria-disabled={!editable} aria-label={editable ? `Edit unit ${variable.unit}` : `Current unit ${variable.unit}`} className="drawer-unit-button" onClick={editable ? () => setIsEditing("unit") : notifyProtectedVariable} type="button">{variable.unit}</button></strong>}</div>
                <dl className="drawer-metadata"><div><dt>Description</dt><dd>{variable.description}</dd></div><div><dt>Last updated</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(variable.updatedAt)}</dd></div></dl>
              </div>
              {editable && isEditing && hasUnsavedChanges ? <footer className="drawer-footer"><Tooltip label="Save changes"><Button aria-label="Save changes" className="save-icon-button" form={`variable-editor-${variable.externalKey}`} type="submit"><svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M5 3h12l4 4v14H5z" /><path d="M8 3v6h8V3" /><path d="M8 21v-7h8v7" /></svg></Button></Tooltip></footer> : null}
            </section> : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
