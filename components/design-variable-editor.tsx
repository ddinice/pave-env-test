"use client";

import { useActionState, useEffect, useState } from "react";

import { updateVariable, type ManualEditState } from "../app/variables/actions";
import { hasDesignVariableDraftChanges } from "../lib/design-variables/draft";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const initialState: ManualEditState = {};

export function DesignVariableEditor({ externalKey, formId, initialFocus, inline = false, onDirtyChange, onSaved, unit, value }: { externalKey: string; formId?: string; initialFocus?: "unit" | "value"; inline?: boolean; onDirtyChange?: (isDirty: boolean) => void; onSaved?: () => void; unit: string; value: string }) {
  const [state, formAction, isPending] = useActionState(updateVariable, initialState);
  const [draftUnit, setDraftUnit] = useState(unit);
  const [draftValue, setDraftValue] = useState(value);
  const isDirty = hasDesignVariableDraftChanges({ draftUnit, draftValue, unit, value });

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  useEffect(() => {
    if (state.status !== "updated") return;
    onSaved?.();
  }, [state]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form action={formAction} className={inline ? "edit-form drawer-inline-editor" : "edit-form"} id={formId} noValidate>
      <input name="externalKey" type="hidden" value={externalKey} />
      {state.status === "updated" ? <p className="save-notice" role="status">Changes saved.</p> : null}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <div className="field">
        <Label htmlFor="variable-value">Value</Label>
        <Input aria-describedby={state.fieldErrors?.value ? "variable-value-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.value)} autoFocus={inline && initialFocus === "value"} className={inline ? "drawer-value-input" : ""} id="variable-value" name="value" required value={draftValue} inputMode="decimal" onChange={(event) => setDraftValue(event.target.value)} style={inline ? { width: `${Math.max(draftValue.length, 3)}ch` } : undefined} />
        {state.fieldErrors?.value?.map((error) => <p className="field-error" id="variable-value-error" key={error}>{error}</p>)}
      </div>
      <div className="field">
        <Label htmlFor="variable-unit">Unit</Label>
        <Input aria-describedby={state.fieldErrors?.unit ? "variable-unit-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.unit)} autoFocus={inline && initialFocus === "unit"} className={inline ? "drawer-unit-input" : ""} id="variable-unit" name="unit" required value={draftUnit} onChange={(event) => setDraftUnit(event.target.value)} style={inline ? { width: `${Math.max(draftUnit.length, 2)}ch` } : undefined} />
        {state.fieldErrors?.unit?.map((error) => <p className="field-error" id="variable-unit-error" key={error}>{error}</p>)}
      </div>
      {!formId && isDirty ? <Button disabled={isPending} type="submit">{isPending ? "Saving…" : "Save changes"}</Button> : null}
    </form>
  );
}
