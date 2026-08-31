export type DesignVariableEditorMode = {
  kind: "inline";
  formId: string;
  initialFocus?: "unit" | "value";
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
};

export type Props = {
  externalKey: string;
  unit: string;
  value: string;
  mode?: DesignVariableEditorMode;
};
