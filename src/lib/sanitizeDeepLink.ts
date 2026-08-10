export default function sanitizeDeepLink(url: string): string {
  if (!url) return "";
  const [path, hash] = url.split("#");
  const formattedPath = path.endsWith("/") ? path : `${path}/`;

  return hash !== undefined ? `${formattedPath}#${hash}` : formattedPath;
}
