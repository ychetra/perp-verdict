const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (configuredSiteUrl || "https://perp-verdict.vercel.app").replace(/\/$/, "");

export function verdictPath(symbol: string) {
  return `/verdict/${symbol.toLowerCase()}`;
}

export function verdictUrl(symbol: string) {
  return `${SITE_URL}${verdictPath(symbol)}`;
}
