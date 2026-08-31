import { Drawer } from "vaul";

import { designVariablePublicId } from "../../lib/design-variables/public-id";
import type { DesignVariableRecord } from "../../lib/design-variables/types";
import { LockIcon } from "../icons/icons";
import { Tooltip } from "../ui/tooltip";

export function DrawerHeader({
  variable,
  editable,
  hasUnsavedChanges,
  onClose,
}: {
  variable: DesignVariableRecord;
  editable: boolean;
  hasUnsavedChanges: boolean;
  onClose: () => void;
}) {
  return (
    <header className="drawer-header">
      <div>
        <Drawer.Title className="drawer-title">{variable.name}</Drawer.Title>
        <div className="drawer-identity">
          <p className="eyebrow">{variable.subsystem}</p>
          <p className="external-key" translate="no">
            {designVariablePublicId(variable.externalKey)}
          </p>
        </div>
      </div>
      <div className="drawer-header-actions">
        {!editable ? (
          <Tooltip label="Protected variable">
            <span
              aria-label="Protected variable"
              className="drawer-protected-indicator"
              role="img"
            >
              <LockIcon />
            </span>
          </Tooltip>
        ) : hasUnsavedChanges ? (
          <Tooltip label="Unsaved changes">
            <span
              aria-label="Unsaved changes"
              className="drawer-unsaved-indicator"
              role="status"
            >
              !
            </span>
          </Tooltip>
        ) : null}
        <button
          aria-label="Close variable details"
          className="drawer-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
    </header>
  );
}
