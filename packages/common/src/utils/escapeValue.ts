export function escapeValue(value: string) {
  return value.replaceAll(/([~%_])/g, "~$1");
}
