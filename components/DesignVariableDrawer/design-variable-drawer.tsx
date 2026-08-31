"use client";

import type { CSSProperties } from "react";
import { Drawer } from "vaul";

import { DesignVariableTable } from "../design-variable-table";
import type { DesignVariableRecord } from "../../lib/design-variables/types";
import type { UserRole } from "../types";
import { DrawerBody } from "./drawer-body";
import { DrawerFooter } from "./drawer-footer";
import { DrawerHeader } from "./drawer-header";
import { useDesignVariableDrawer } from "./use-design-variable-drawer";

export function DesignVariableDrawer({
  userRole,
  variables,
}: {
  userRole: UserRole;
  variables: DesignVariableRecord[];
}) {
  const {
    variable,
    editable,
    isEditing,
    setIsEditing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    openDrawer,
    closeDrawer,
    handleSaved,
    notifyProtectedVariable,
  } = useDesignVariableDrawer({ userRole, variables });

  return (
    <>
      <DesignVariableTable onSelect={openDrawer} variables={variables} />
      <Drawer.Root
        direction="right"
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
        open={variable !== null}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content
            className="drawer-content"
            style={
              { "--initial-transform": "calc(100% + 1rem)" } as CSSProperties
            }
          >
            {variable ? (
              <section className="drawer-panel">
                <DrawerHeader
                  editable={editable}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onClose={closeDrawer}
                  variable={variable}
                />
                <DrawerBody
                  editable={editable}
                  isEditing={isEditing}
                  onDirtyChange={setHasUnsavedChanges}
                  onProtectedAttempt={notifyProtectedVariable}
                  onSaved={handleSaved}
                  onStartEditing={setIsEditing}
                  variable={variable}
                />
                {editable && isEditing && hasUnsavedChanges ? (
                  <DrawerFooter formId={`variable-editor-${variable.externalKey}`} />
                ) : null}
              </section>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
