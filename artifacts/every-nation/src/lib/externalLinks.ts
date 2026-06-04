const DEFAULT_ENGG_GAME_URL = "https://end.engg.online";

function normalizeBaseUrl(rawUrl?: string): string {
  const trimmed = rawUrl?.trim();
  const baseUrl = trimmed || DEFAULT_ENGG_GAME_URL;
  return baseUrl.replace(/\/+$/, "");
}

export const ENGG_GAME_URL = normalizeBaseUrl(
  import.meta.env.VITE_ERRANT_NIGHT_URL,
);

export function getGameUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? ENGG_GAME_URL : `${ENGG_GAME_URL}${normalizedPath}`;
}

export function getGameUrlFromWebsitePath(
  pathname: string,
  search = "",
  hash = "",
): string {
  const gamePath =
    pathname === "/end"
      ? "/"
      : pathname.startsWith("/end/")
        ? pathname.slice("/end".length)
        : pathname;

  return getGameUrl(`${gamePath || "/"}${search}${hash}`);
}
