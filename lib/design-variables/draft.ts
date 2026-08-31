export function hasDesignVariableDraftChanges({
  draftUnit,
  draftValue,
  unit,
  value,
}: {
  draftUnit: string;
  draftValue: string;
  unit: string;
  value: string;
}) {
  return draftUnit !== unit || draftValue !== value;
}
