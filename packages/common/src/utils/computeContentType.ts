const CONTENT_TYPES = new Map<string, string>([
  ["html", "text/html"],
  ["css", "text/css"],
  ["js", "application/javascript"],
  ["json", "application/json"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["gif", "image/gif"],
  ["svg", "image/svg+xml"],
]);

export function computeContentType(path: string) {
  const i = path.lastIndexOf(".");
  if (i === -1) return "application/octet-stream";
  const extension = path.substring(i + 1);
  return CONTENT_TYPES.get(extension) || "application/octet-stream";
}
