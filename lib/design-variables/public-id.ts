export function designVariablePublicId(externalKey: string) {
  const number = [...externalKey].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 999, 0) + 1;
  return `DV-${String(number).padStart(3, "0")}`;
}
