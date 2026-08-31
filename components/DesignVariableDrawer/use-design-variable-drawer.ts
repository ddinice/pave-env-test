"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { DesignVariableRecord } from "../../lib/design-variables/types";
import type { UserRole } from "../types";

export function useDesignVariableDrawer({
  userRole,
  variables,
}: {
  userRole: UserRole;
  variables: DesignVariableRecord[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<"unit" | "value" | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedExternalKey, setSelectedExternalKey] = useState<string | null>(
    null,
  );
  const variable =
    variables.find(({ externalKey }) => externalKey === selectedExternalKey) ??
    null;
  const editable = Boolean(
    variable && (!variable.isProtected || userRole === "ENGINEERING_LEAD"),
  );

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

  return {
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
  };
}
