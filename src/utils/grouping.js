export function shortIteration(path) {
  if (!path) return "";
  const parts = path.split("\\");
  return parts[parts.length - 1] || path;
}
