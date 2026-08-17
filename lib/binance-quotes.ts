import "server-only";

import { getCachedUniverse } from "./universe";

const BINANCE_PREMIUM_ENDPOINT = "https://fapi.binance.com/fapi/v1/premiumIndex";
export const BINANCE_QUOTE_TIMEOUT_MS = 5_000;
export const BINANCE_QUOTE_MAX_AGE_MS = 15_000;
const MAX_FUTURE_SOURCE_MS = 5_000;

export type BinanceQuote = {
  symbol: string;
  rate: number;
  markPrice: number;
  updatedAt: number;
};

type BinanceQuoteUnavailableReason = "timeout" | "http_error" | "malformed_response" | "source_unavailable" | "universe_unavailable";

export type BinanceQuoteResult =
  | { kind: "available"; generatedAt: string; quotes: BinanceQuote[]; source: string }
  | { kind: "unavailable"; generatedAt: string; reason: BinanceQuoteUnavailableReason; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finite(value: unknown, minimum = -Infinity) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : undefined;
}

function unavailable(now: number, reason: BinanceQuoteUnavailableReason, message: string): BinanceQuoteResult {
  return { kind: "unavailable", generatedAt: new Date(now).toISOString(), reason, message };
}

/**
 * Validate only the fields needed by the live scanner. The allowlist comes
 * from the server-selected Binance x Bybit universe; callers cannot proxy an
 * arbitrary symbol through this boundary.
 */
export function validateBinanceQuoteBatch(data: unknown, allowedSymbols: readonly string[], now: number): BinanceQuote[] | undefined {
  if (!Array.isArray(data)) return undefined;
  const allowed = new Set(allowedSymbols);
  const seen = new Set<string>();
  const quotes: BinanceQuote[] = [];
  for (const item of data) {
    if (!isRecord(item) || typeof item.symbol !== "string" || !allowed.has(item.symbol)) continue;
    if (seen.has(item.symbol)) return undefined;
    seen.add(item.symbol);
    const markPrice = finite(item.markPrice, Number.MIN_VALUE);
    const rate = finite(item.lastFundingRate);
    const updatedAt = finite(item.time, 1);
    if (markPrice === undefined || rate === undefined || updatedAt === undefined) continue;
    if (updatedAt > now + MAX_FUTURE_SOURCE_MS || now - updatedAt > BINANCE_QUOTE_MAX_AGE_MS) continue;
    quotes.push({ symbol: item.symbol, rate, markPrice, updatedAt });
  }
  return quotes.length ? quotes : undefined;
}

async function fetchBinanceBatch(fetchImpl: typeof fetch, now: number): Promise<BinanceQuoteResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BINANCE_QUOTE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(BINANCE_PREMIUM_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return unavailable(now, "http_error", `Binance public quote source returned HTTP ${response.status}.`);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return unavailable(now, "malformed_response", "Binance public quote source returned malformed JSON.");
    }
    const universe = await getCachedUniverse();
    if (universe.kind !== "available") return unavailable(now, "universe_unavailable", "The validated pair universe is unavailable.");
    const quotes = validateBinanceQuoteBatch(body, universe.pairs.map((pair) => pair.symbol), now);
    if (!quotes) return unavailable(now, "malformed_response", "Binance public quote source had no fresh allowlisted quotes.");
    return { kind: "available", generatedAt: new Date(now).toISOString(), quotes, source: BINANCE_PREMIUM_ENDPOINT };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return unavailable(now, timedOut ? "timeout" : "source_unavailable", timedOut ? "Binance public quote source timed out." : "Binance public quote source could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

export async function getBinanceQuotes(options: { now?: number; fetchImpl?: typeof fetch } = {}): Promise<BinanceQuoteResult> {
  const now = options.now ?? Date.now();
  return fetchBinanceBatch(options.fetchImpl ?? fetch, now);
}
