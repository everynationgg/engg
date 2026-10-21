export const ERRANT_NIGHT_PATH = "/errant-night";
export const DISCORD_INVITE_URL = "https://discord.gg/everynation";
export const STUDIO_SITE_URL = "https://engg.online";
export const VISIEN_AI_URL = "https://visien-gray.vercel.app/";
export const PROJECT_STUDIO_URL = VISIEN_AI_URL;

export function getGameUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/"
    ? ERRANT_NIGHT_PATH
    : `${ERRANT_NIGHT_PATH}${normalizedPath}`;
}

export function launchErrantNight(path = "/"): void {
  window.location.assign(getGameUrl(path));
}
