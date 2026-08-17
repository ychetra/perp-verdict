import "server-only";

export type NewsLane = "crypto" | "ai";
export type NewsItem = {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  lane: NewsLane;
};

export type NewsResponse =
  | { kind: "available"; generatedAt: string; items: { crypto: NewsItem[]; ai: NewsItem[] } }
  | { kind: "unavailable"; generatedAt: string; message: string };

const MAX_TITLE_LENGTH = 180;
const FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", lane: "crypto" as const, allowedHostname: "www.coindesk.com" },
  { url: "https://blog.google/rss/", source: "Google Blog", lane: "ai" as const, allowedHostname: "blog.google" },
  { url: "https://blog.cloudflare.com/rss/", source: "Cloudflare Blog", lane: "ai" as const, allowedHostname: "blog.cloudflare.com" },
];

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : parseInt(code, 10)))
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function plainText(value: string) {
  return decodeEntities(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function tagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1] : "";
}

export function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => {
    const body = match[1];
    return { title: plainText(tagValue(body, "title")), url: decodeEntities(tagValue(body, "link").trim()), publishedAt: plainText(tagValue(body, "pubDate") || tagValue(body, "published") || tagValue(body, "updated")) };
  });
}

export function sanitizeNewsItem(item: { title?: unknown; url?: unknown; publishedAt?: unknown }, source: string, lane: NewsLane, allowedHostname: string): NewsItem | null {
  const title = typeof item.title === "string" ? item.title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH) : "";
  const url = typeof item.url === "string" ? item.url.trim() : "";
  const publishedAt = typeof item.publishedAt === "string" ? item.publishedAt.trim() : "";
  const date = Date.parse(publishedAt);
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }
  if (!title || parsedUrl.protocol !== "https:" || parsedUrl.hostname.toLowerCase() !== allowedHostname || parsedUrl.username || parsedUrl.password || parsedUrl.port || !Number.isFinite(date)) return null;
  return { title, url: parsedUrl.toString(), publishedAt: new Date(date).toISOString(), source, lane };
}

async function fetchFeed(feed: (typeof FEEDS)[number]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(feed.url, { next: { revalidate: 900 }, signal: controller.signal });
    if (!response.ok) return [];
    const xml = await response.text();
    return parseRssItems(xml).map((item) => sanitizeNewsItem(item, feed.source, feed.lane, feed.allowedHostname)).filter((item): item is NewsItem => item !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getNewsBriefs(): Promise<NewsResponse> {
  const generatedAt = new Date().toISOString();
  const feeds = await Promise.all(FEEDS.map(fetchFeed));
  const all = feeds.flat();
  if (!all.length) return { kind: "unavailable", generatedAt, message: "Linked news is temporarily unavailable. The funding scanner is still live." };
  const sortRecent = (a: NewsItem, b: NewsItem) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  return { kind: "available", generatedAt, items: { crypto: all.filter((item) => item.lane === "crypto").sort(sortRecent).slice(0, 3), ai: all.filter((item) => item.lane === "ai").sort(sortRecent).slice(0, 3) } };
}
