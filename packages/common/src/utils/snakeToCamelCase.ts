export function snakeToCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (letter) => letter[1].toUpperCase());
}
