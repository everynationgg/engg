export const ERRANT_NIGHT_PATH = "/errant-night";

export function getGameUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/"
    ? ERRANT_NIGHT_PATH
    : `${ERRANT_NIGHT_PATH}${normalizedPath}`;
}
