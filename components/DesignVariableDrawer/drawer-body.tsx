import { DesignVariableEditor } from "../DesignVariableEditor/design-variable-editor";
import { DesignVariableHistory } from "../DesignVariableHistory/design-variable-history";
import type { DesignVariableRecord } from "../../lib/design-variables/types";
import { formatAbsoluteDate } from "../../lib/utils";

export function DrawerBody({
  variable,
  editable,
  isEditing,
  onStartEditing,
  onProtectedAttempt,
  onDirtyChange,
  onSaved,
}: {
  variable: DesignVariableRecord;
  editable: boolean;
  isEditing: "unit" | "value" | null;
  onStartEditing: (field: "unit" | "value") => void;
  onProtectedAttempt: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <div className="drawer-body">
      <div className="drawer-current-value">
        <span>Current value</span>
        {editable && isEditing ? (
          <DesignVariableEditor
            externalKey={variable.externalKey}
            mode={{
              kind: "inline",
              formId: `variable-editor-${variable.externalKey}`,
              initialFocus: isEditing,
              onDirtyChange,
              onSaved,
            }}
            unit={variable.unit}
            value={variable.value}
          />
        ) : (
          <strong>
            <button
              aria-disabled={!editable}
              aria-label={
                editable
                  ? `Edit current number ${variable.value}`
                  : `Current number ${variable.value}`
              }
              className="drawer-value-button"
              onClick={
                editable ? () => onStartEditing("value") : onProtectedAttempt
              }
              type="button"
            >
              {variable.value}
            </button>{" "}
            <button
              aria-disabled={!editable}
              aria-label={
                editable
                  ? `Edit unit ${variable.unit}`
                  : `Current unit ${variable.unit}`
              }
              className="drawer-unit-button"
              onClick={
                editable ? () => onStartEditing("unit") : onProtectedAttempt
              }
              type="button"
            >
              {variable.unit}
            </button>
          </strong>
        )}
      </div>
      <DesignVariableHistory
        externalKey={variable.externalKey}
        key={variable.externalKey}
        unit={variable.unit}
      />
      <dl className="drawer-metadata">
        <div>
          <dt>Description</dt>
          <dd>{variable.description}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatAbsoluteDate(variable.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
