import "server-only";

export const MAX_UNIVERSE_PAIRS = 25;
export const UNIVERSE_CACHE_TTL_MS = 15 * 60_000;
export const DEFAULT_BINANCE_FUNDING_INTERVAL_HOURS = 8;

const BINANCE_BASE = "https://fapi.binance.com";
const BYBIT_BASE = "https://api.bybit.com";
const REQUEST_TIMEOUT_MS = 5_000;

export type UniversePair = {
  symbol: string;
  baseAsset: string;
  fundingIntervalHours: number;
  binanceQuoteVolumeUsd: number;
  bybitQuoteVolumeUsd: number;
  commonQuoteVolumeUsd: number;
};

export type UniverseAvailable = {
  kind: "available";
  generatedAt: string;
  maxPairs: number;
  pairs: UniversePair[];
  sources: { binance: string[]; bybit: string[] };
};

export type UniverseUnavailable = {
  kind: "unavailable";
  generatedAt: string;
  reason: "timeout" | "http_error" | "malformed_response" | "source_unavailable" | "no_common_pairs";
  message: string;
};

export type UniverseResult = UniverseAvailable | UniverseUnavailable;

type FetchLike = typeof fetch;
export type UniverseOptions = { now?: number; fetchImpl?: FetchLike; timeoutMs?: number };

type BinanceInstrument = { symbol: string; baseAsset: string; fundingIntervalHours: number };
type BybitInstrument = { symbol: string; baseAsset: string; fundingIntervalHours: number };
type BinanceVolume = { symbol: string; quoteVolumeUsd: number };
type BybitVolume = { symbol: string; quoteVolumeUsd: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : undefined;
}

function finite(value: unknown, minimum = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : undefined;
}

/** Base assets are compared exactly after one documented normalization pass. */
export function normalizeBaseAsset(value: unknown) {
  const normalized = text(value);
  return normalized && /^[A-Z0-9]+$/.test(normalized) ? normalized : undefined;
}

function symbol(value: unknown) {
  const normalized = text(value);
  return normalized && /^[A-Z0-9]+USDT$/.test(normalized) ? normalized : undefined;
}

export function filterBinanceInstruments(data: unknown): BinanceInstrument[] | undefined {
  if (!isRecord(data) || !Array.isArray(data.symbols)) return undefined;
  return data.symbols.flatMap((item) => {
    if (!isRecord(item) || item.contractType !== "PERPETUAL" || item.status !== "TRADING" || item.quoteAsset !== "USDT" || item.marginAsset !== "USDT") return [];
    const pair = symbol(item.symbol);
    const baseAsset = normalizeBaseAsset(item.baseAsset);
    if (!pair || !baseAsset) return [];
    return [{ symbol: pair, baseAsset, fundingIntervalHours: DEFAULT_BINANCE_FUNDING_INTERVAL_HOURS }];
  });
}

export function applyBinanceFundingOverrides(instruments: BinanceInstrument[], data: unknown): BinanceInstrument[] | undefined {
  if (!Array.isArray(instruments) || !Array.isArray(data)) return undefined;
  const overrides = new Map<string, number>();
  for (const item of data) {
    if (!isRecord(item)) continue;
    const pair = symbol(item.symbol);
    const hours = finite(item.fundingIntervalHours, Number.MIN_VALUE);
    if (pair && hours !== undefined) overrides.set(pair, hours);
  }
  return instruments.map((item) => ({ ...item, fundingIntervalHours: overrides.get(item.symbol) ?? item.fundingIntervalHours }));
}

export function filterBybitInstruments(data: unknown): { instruments: BybitInstrument[]; nextPageCursor?: string } | undefined {
  if (!isRecord(data) || data.retCode !== 0 || !isRecord(data.result) || !Array.isArray(data.result.list)) return undefined;
  const instruments = data.result.list.flatMap((item) => {
    if (!isRecord(item) || item.contractType !== "LinearPerpetual" || item.status !== "Trading" || item.quoteCoin !== "USDT" || item.settleCoin !== "USDT") return [];
    const pair = symbol(item.symbol);
    const baseAsset = normalizeBaseAsset(item.baseCoin);
    const minutes = finite(item.fundingInterval, Number.MIN_VALUE);
    if (!pair || !baseAsset || minutes === undefined || minutes <= 0) return [];
    return [{ symbol: pair, baseAsset, fundingIntervalHours: minutes / 60 }];
  });
  const nextPageCursor = typeof data.result.nextPageCursor === "string" && data.result.nextPageCursor ? data.result.nextPageCursor : undefined;
  return { instruments, nextPageCursor };
}

export function filterBinanceVolumes(data: unknown): BinanceVolume[] | undefined {
  if (!Array.isArray(data)) return undefined;
  return data.flatMap((item) => {
    if (!isRecord(item)) return [];
    const pair = symbol(item.symbol);
    const quoteVolumeUsd = finite(item.quoteVolume, Number.MIN_VALUE);
    return pair && quoteVolumeUsd !== undefined ? [{ symbol: pair, quoteVolumeUsd }] : [];
  });
}

export function filterBybitVolumes(data: unknown): BybitVolume[] | undefined {
  if (!isRecord(data) || data.retCode !== 0 || !isRecord(data.result) || !Array.isArray(data.result.list)) return undefined;
  return data.result.list.flatMap((item) => {
    if (!isRecord(item)) return [];
    const pair = symbol(item.symbol);
    const quoteVolumeUsd = finite(item.turnover24h, Number.MIN_VALUE);
    return pair && quoteVolumeUsd !== undefined ? [{ symbol: pair, quoteVolumeUsd }] : [];
  });
}

export function intersectAndSelectPairs(binance: BinanceInstrument[], bybit: BybitInstrument[], binanceVolumes: BinanceVolume[], bybitVolumes: BybitVolume[], limit = MAX_UNIVERSE_PAIRS): UniversePair[] {
  const bybitBySymbol = new Map(bybit.map((item) => [item.symbol, item]));
  const binanceVolumeBySymbol = new Map(binanceVolumes.map((item) => [item.symbol, item.quoteVolumeUsd]));
  const bybitVolumeBySymbol = new Map(bybitVolumes.map((item) => [item.symbol, item.quoteVolumeUsd]));
  return binance.flatMap((item) => {
    const counterpart = bybitBySymbol.get(item.symbol);
    const binanceVolume = binanceVolumeBySymbol.get(item.symbol);
    const bybitVolume = bybitVolumeBySymbol.get(item.symbol);
    if (!counterpart || counterpart.baseAsset !== item.baseAsset || Math.abs(counterpart.fundingIntervalHours - item.fundingIntervalHours) > 0.01 || binanceVolume === undefined || bybitVolume === undefined) return [];
    return [{ symbol: item.symbol, baseAsset: item.baseAsset, fundingIntervalHours: item.fundingIntervalHours, binanceQuoteVolumeUsd: binanceVolume, bybitQuoteVolumeUsd: bybitVolume, commonQuoteVolumeUsd: Math.min(binanceVolume, bybitVolume) }];
  }).sort((a, b) => b.commonQuoteVolumeUsd - a.commonQuoteVolumeUsd || a.symbol.localeCompare(b.symbol)).slice(0, Math.max(0, Math.min(MAX_UNIVERSE_PAIRS, limit)));
}

function unavailable(now: number, reason: UniverseUnavailable["reason"], message: string): UniverseUnavailable {
  return { kind: "unavailable", generatedAt: new Date(now).toISOString(), reason, message };
}

function isUnavailable(value: unknown): value is UniverseUnavailable {
  return isRecord(value) && value.kind === "unavailable" && typeof value.message === "string";
}

async function getJson(endpoint: string, fetchImpl: FetchLike, timeoutMs: number, now: number): Promise<{ data: unknown; endpoint: string } | UniverseUnavailable> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, { method: "GET", signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return unavailable(now, "http_error", `Public source returned HTTP ${response.status}.`);
    try {
      return { data: await response.json(), endpoint };
    } catch {
      return unavailable(now, "malformed_response", "Public source returned malformed JSON.");
    }
  } catch (error) {
    return unavailable(now, error instanceof DOMException && error.name === "AbortError" ? "timeout" : "source_unavailable", error instanceof DOMException && error.name === "AbortError" ? "Public source timed out." : "Public source could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

async function getBybitInstruments(fetchImpl: FetchLike, timeoutMs: number, now: number) {
  const all: BybitInstrument[] = [];
  const endpoints: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const endpoint = `${BYBIT_BASE}/v5/market/instruments-info?category=linear&limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const response = await getJson(endpoint, fetchImpl, timeoutMs, now);
    if (isUnavailable(response)) return response;
    const parsed = filterBybitInstruments(response.data);
    if (!parsed) return unavailable(now, "malformed_response", "Bybit instrument metadata failed validation.");
    all.push(...parsed.instruments);
    endpoints.push(endpoint);
    if (!parsed.nextPageCursor) return { instruments: all, endpoints };
    cursor = parsed.nextPageCursor;
  }
  return unavailable(now, "malformed_response", "Bybit instrument pagination exceeded the safety limit.");
}

let cachedUniverse: { expiresAt: number; result: Promise<UniverseResult> } | undefined;

export function clearUniverseCache() {
  cachedUniverse = undefined;
}

export async function fetchUniverse(options: UniverseOptions = {}): Promise<UniverseResult> {
  const now = options.now ?? Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const binanceExchangeEndpoint = `${BINANCE_BASE}/fapi/v1/exchangeInfo`;
  const binanceFundingEndpoint = `${BINANCE_BASE}/fapi/v1/fundingInfo`;
  const binanceTickerEndpoint = `${BINANCE_BASE}/fapi/v1/ticker/24hr`;
  const bybitTickerEndpoint = `${BYBIT_BASE}/v5/market/tickers?category=linear`;
  const [exchangeResponse, fundingResponse, binanceTickerResponse, bybitTickerResponse, bybitInstrumentResponse] = await Promise.all([
    getJson(binanceExchangeEndpoint, fetchImpl, timeoutMs, now),
    getJson(binanceFundingEndpoint, fetchImpl, timeoutMs, now),
    getJson(binanceTickerEndpoint, fetchImpl, timeoutMs, now),
    getJson(bybitTickerEndpoint, fetchImpl, timeoutMs, now),
    getBybitInstruments(fetchImpl, timeoutMs, now),
  ]);
  const failures = [exchangeResponse, fundingResponse, binanceTickerResponse, bybitTickerResponse, bybitInstrumentResponse].filter(isUnavailable);
  if (failures.length) return failures[0];
  const [exchange, funding, binanceTicker, bybitTicker, bybitInstruments] = [exchangeResponse, fundingResponse, binanceTickerResponse, bybitTickerResponse, bybitInstrumentResponse] as [{ data: unknown; endpoint: string }, { data: unknown; endpoint: string }, { data: unknown; endpoint: string }, { data: unknown; endpoint: string }, { instruments: BybitInstrument[]; endpoints: string[] }];
  const binance = filterBinanceInstruments(exchange.data);
  const overrides = applyBinanceFundingOverrides(binance ?? [], funding.data);
  const binanceVolumes = filterBinanceVolumes(binanceTicker.data);
  const bybitVolumes = filterBybitVolumes(bybitTicker.data);
  if (!binance || !overrides || !binanceVolumes || !bybitVolumes) return unavailable(now, "malformed_response", "Exchange metadata or 24h volume failed validation.");
  const pairs = intersectAndSelectPairs(overrides, bybitInstruments.instruments, binanceVolumes, bybitVolumes);
  if (!pairs.length) return unavailable(now, "no_common_pairs", "No active USDT perpetuals with matching cadence and current volume were found.");
  return { kind: "available", generatedAt: new Date(now).toISOString(), maxPairs: MAX_UNIVERSE_PAIRS, pairs, sources: { binance: [binanceExchangeEndpoint, binanceFundingEndpoint, binanceTickerEndpoint], bybit: [bybitTickerEndpoint, ...bybitInstruments.endpoints] } };
}

export function getCachedUniverse(options: UniverseOptions = {}): Promise<UniverseResult> {
  if (options.fetchImpl || options.now !== undefined || options.timeoutMs !== undefined) return fetchUniverse(options);
  const now = Date.now();
  if (cachedUniverse && cachedUniverse.expiresAt > now) return cachedUniverse.result;
  const result = fetchUniverse();
  cachedUniverse = { expiresAt: now + UNIVERSE_CACHE_TTL_MS, result };
  return result;
}
