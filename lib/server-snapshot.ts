import "server-only";
import { createHash } from "node:crypto";
import type { Opportunity, OpportunityInput, Venue } from "./types";

export const SUPPORTED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"] as const;
export type SupportedSymbol = (typeof SUPPORTED_SYMBOLS)[number];

const BINANCE_BASE = "https://fapi.binance.com";
const BYBIT_BASE = "https://api.bybit.com";
const REQUEST_TIMEOUT_MS = 5_000;
const MAX_SOURCE_AGE_MS = 15_000;
const MAX_FUTURE_SOURCE_MS = 30_000;
const MAX_TICKER_SKEW_MS = 15_000;
const MAX_CADENCE_JITTER_MINUTES = 0.25;

export const MODEL_ASSUMPTIONS = {
  notionalUsd: 10_000,
  roundTripFeeBps: 12,
  transferReserveBps: 4,
  liquidationBufferBps: 9,
} as const;

export type SnapshotReason =
  | "unsupported_pair"
  | "timeout"
  | "http_error"
  | "malformed_response"
  | "invalid_source_time"
  | "source_timestamp_skew"
  | "cadence_mismatch"
  | "insufficient_depth"
  | "source_unavailable";

export type EndpointProvenance = {
  endpoint: string;
  capturedAt: string;
  responseMs: number;
  sourceTimestamp: string;
  payloadSha256: string;
};

export type SnapshotVenue = {
  venue: Venue;
  currentQuotedFundingRate: number;
  markPrice: number;
  bid: number;
  ask: number;
  fundingIntervalHours: number;
  fundingLabel: "venue-reported ticker funding rate";
  lastSettledFundingRate?: number;
  lastSettledAt?: string;
};

export type LiveSnapshot = {
  kind: "available";
  symbol: SupportedSymbol;
  capturedAt: string;
  snapshotId: string;
  cadence: { binanceHours: number; bybitHours: number; comparable: true };
  sources: { binance: EndpointProvenance[]; bybit: EndpointProvenance[] };
  market: { binance: SnapshotVenue; bybit: SnapshotVenue };
  model: Opportunity;
};

export type UnavailableSnapshot = {
  kind: "unavailable";
  symbol: string;
  capturedAt: string;
  reason: SnapshotReason;
  message: string;
};

export type SnapshotResult = LiveSnapshot | UnavailableSnapshot;

type FetchLike = typeof fetch;
export type SnapshotOptions = { now?: number; fetchImpl?: FetchLike; timeoutMs?: number; receiptClock?: () => number };

type Fetched<T> = { data: T; provenance: EndpointProvenance };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finite(value: unknown, minimum = -Infinity) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : undefined;
}

function hashPayload(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

function validSourceTime(timestamp: number, now: number) {
  return timestamp > 0 && timestamp <= now + MAX_FUTURE_SOURCE_MS && now - timestamp <= MAX_SOURCE_AGE_MS;
}

function unavailable(symbol: string, reason: SnapshotReason, now: number, message: string): UnavailableSnapshot {
  return { kind: "unavailable", symbol, capturedAt: new Date(now).toISOString(), reason, message };
}

async function fetchJson<T>(endpoint: string, fetchImpl: FetchLike, timeoutMs: number, now: number, receiptClock?: () => number): Promise<Fetched<T> | UnavailableSnapshot> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, { method: "GET", signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.text();
    const receivedAt = receiptClock?.() ?? Date.now();
    const payloadSha256 = hashPayload(body);
    if (!response.ok) return unavailable("", "http_error", now, `Public source returned HTTP ${response.status}.`);
    let data: T;
    try { data = JSON.parse(body) as T; } catch { return unavailable("", "malformed_response", now, "Public source returned malformed JSON."); }
    return { data, provenance: { endpoint, capturedAt: new Date(receivedAt).toISOString(), responseMs: Math.max(0, receivedAt - started), sourceTimestamp: "", payloadSha256 } };
  } catch (error) {
    return unavailable("", error instanceof DOMException && error.name === "AbortError" ? "timeout" : "source_unavailable", now, error instanceof DOMException && error.name === "AbortError" ? "Public source timed out." : "Public source could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

function withSymbol(result: UnavailableSnapshot, symbol: string) {
  return { ...result, symbol };
}

function isUnavailable(value: unknown): value is UnavailableSnapshot {
  return isRecord(value) && value.kind === "unavailable" && typeof value.message === "string";
}

function levels(value: unknown): [number, number][] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed = value.map((level) => {
    if (!Array.isArray(level) || level.length < 2) return undefined;
    const price = finite(level[0], Number.MIN_VALUE);
    const size = finite(level[1], Number.MIN_VALUE);
    return price === undefined || size === undefined ? undefined : [price, size] as [number, number];
  });
  return parsed.some((level) => !level) ? undefined : parsed as [number, number][];
}

function depthImpactBps(book: [number, number][], notionalUsd: number, side: "bid" | "ask") {
  const sorted = [...book].sort((a, b) => side === "bid" ? b[0] - a[0] : a[0] - b[0]);
  if (!sorted.length || !Number.isFinite(notionalUsd) || notionalUsd <= 0) return undefined;
  const best = sorted[0][0];
  let remaining = notionalUsd;
  let base = 0;
  let quote = 0;
  for (const [price, size] of sorted) {
    const quoteFill = Math.min(remaining, price * size);
    quote += quoteFill;
    base += quoteFill / price;
    remaining -= quoteFill;
    if (remaining <= 0) break;
  }
  if (remaining > 0 || base <= 0) return undefined;
  return Math.abs((quote / base - best) / best) * 10_000;
}

function sourceTimeOrUnavailable(result: EndpointProvenance, timestamp: number, now: number, symbol: string) {
  if (!Number.isFinite(timestamp) || !validSourceTime(timestamp, now)) return withSymbol(unavailable(symbol, "invalid_source_time", now, "Public source timestamp is stale or invalid."), symbol);
  result.sourceTimestamp = new Date(timestamp).toISOString();
  return undefined;
}

function normalizeBinancePremium(data: unknown, provenance: EndpointProvenance, symbol: string, now: number) {
  if (!isRecord(data) || data.symbol !== symbol) return unavailable(symbol, "malformed_response", now, "Binance premium response failed validation.");
  const markPrice = finite(data.markPrice, Number.MIN_VALUE);
  const rate = finite(data.lastFundingRate);
  const nextFundingTime = finite(data.nextFundingTime, 1);
  const sourceTime = finite(data.time, 1);
  if (markPrice === undefined || rate === undefined || nextFundingTime === undefined || sourceTime === undefined) return unavailable(symbol, "malformed_response", now, "Binance premium response is missing validated fields.");
  const invalid = sourceTimeOrUnavailable(provenance, sourceTime, now, symbol);
  return invalid ?? { markPrice, rate, nextFundingTime, sourceTime };
}

function normalizeBinanceDepth(data: unknown, provenance: EndpointProvenance, symbol: string, now: number) {
  if (!isRecord(data)) return unavailable(symbol, "malformed_response", now, "Binance order book response failed validation.");
  const bids = levels(data.bids);
  const asks = levels(data.asks);
  const sourceTime = finite(data.E ?? data.T, 1);
  if (!bids?.length || !asks?.length || sourceTime === undefined) return unavailable(symbol, "malformed_response", now, "Binance order book response is missing validated depth.");
  const invalid = sourceTimeOrUnavailable(provenance, sourceTime, now, symbol);
  return invalid ?? { bids, asks, sourceTime };
}

function normalizeBinanceHistory(data: unknown, provenance: EndpointProvenance, symbol: string, now: number) {
  if (!Array.isArray(data) || data.length < 2) return unavailable(symbol, "malformed_response", now, "Binance funding history is insufficient to establish cadence.");
  const entries = data.map((item) => isRecord(item) ? { time: finite(item.fundingTime, 1), rate: finite(item.fundingRate) } : undefined).filter((entry): entry is { time: number; rate: number | undefined } => entry?.time !== undefined).sort((a, b) => b.time - a.time);
  const times = entries.map((entry) => entry.time);
  if (times.length < 2) return unavailable(symbol, "malformed_response", now, "Binance funding history timestamps failed validation.");
  const cadence = (times[0] - times[1]) / 3_600_000;
  if (!Number.isFinite(cadence) || cadence <= 0 || times[0] > now + MAX_FUTURE_SOURCE_MS) return unavailable(symbol, "invalid_source_time", now, "Binance funding history timestamp is invalid.");
  if (entries[0].rate === undefined) return unavailable(symbol, "malformed_response", now, "Binance settled funding history is missing its rate.");
  const cadenceMinutes = cadence * 60;
  const normalizedMinutes = Math.round(cadenceMinutes);
  if (Math.abs(cadenceMinutes - normalizedMinutes) > MAX_CADENCE_JITTER_MINUTES) return unavailable(symbol, "cadence_mismatch", now, "Binance funding cadence contains material timestamp jitter.");
  provenance.sourceTimestamp = new Date(times[0]).toISOString();
  return { cadence: normalizedMinutes / 60, lastSettledFundingRate: entries[0].rate, lastSettledAt: provenance.sourceTimestamp };
}

function normalizeBinanceInstrument(data: unknown, symbol: string, now: number) {
  if (!isRecord(data) || !Array.isArray(data.symbols)) return unavailable(symbol, "malformed_response", now, "Binance instrument response failed validation.");
  const instrument = data.symbols.find((item) => isRecord(item) && item.symbol === symbol);
  if (!isRecord(instrument) || instrument.contractType !== "PERPETUAL" || instrument.status !== "TRADING" || instrument.quoteAsset !== "USDT" || instrument.marginAsset !== "USDT") return unavailable(symbol, "malformed_response", now, "Binance instrument metadata failed validation.");
  return { valid: true };
}

function normalizeBybitTicker(data: unknown, provenance: EndpointProvenance, symbol: string, now: number) {
  if (!isRecord(data) || data.retCode !== 0 || !isRecord(data.result) || !Array.isArray(data.result.list) || !isRecord(data.result.list[0])) return unavailable(symbol, "malformed_response", now, "Bybit ticker response failed validation.");
  const ticker = data.result.list[0];
  if (ticker.symbol !== symbol) return unavailable(symbol, "malformed_response", now, "Bybit ticker symbol failed validation.");
  const rate = finite(ticker.fundingRate);
  const interval = finite(ticker.fundingIntervalHour, Number.MIN_VALUE);
  const markPrice = finite(ticker.markPrice, Number.MIN_VALUE);
  const bid = finite(ticker.bid1Price, Number.MIN_VALUE);
  const ask = finite(ticker.ask1Price, Number.MIN_VALUE);
  const sourceTime = finite(data.time, 1);
  if ([rate, interval, markPrice, bid, ask, sourceTime].some((value) => value === undefined)) return unavailable(symbol, "malformed_response", now, "Bybit ticker response is missing validated fields.");
  const invalid = sourceTimeOrUnavailable(provenance, sourceTime!, now, symbol);
  return invalid ?? { rate: rate!, interval: interval!, markPrice: markPrice!, bid: bid!, ask: ask!, sourceTime: sourceTime! };
}

function normalizeBybitDepth(data: unknown, provenance: EndpointProvenance, symbol: string, now: number) {
  if (!isRecord(data) || data.retCode !== 0 || !isRecord(data.result)) return unavailable(symbol, "malformed_response", now, "Bybit order book response failed validation.");
  const bids = levels(data.result.b);
  const asks = levels(data.result.a);
  const sourceTime = finite(data.result.ts, 1);
  if (!bids?.length || !asks?.length || sourceTime === undefined) return unavailable(symbol, "malformed_response", now, "Bybit order book response is missing validated depth.");
  const invalid = sourceTimeOrUnavailable(provenance, sourceTime, now, symbol);
  return invalid ?? { bids, asks, sourceTime };
}

function normalizeBybitInstrument(data: unknown, symbol: string, now: number) {
  if (!isRecord(data) || data.retCode !== 0 || !isRecord(data.result) || !Array.isArray(data.result.list) || !isRecord(data.result.list[0])) return unavailable(symbol, "malformed_response", now, "Bybit instrument response failed validation.");
  const instrument = data.result.list[0];
  if (!isRecord(instrument) || instrument.contractType !== "LinearPerpetual" || instrument.status !== "Trading" || instrument.quoteCoin !== "USDT" || instrument.settleCoin !== "USDT") return unavailable(symbol, "malformed_response", now, "Bybit instrument metadata failed validation.");
  const fundingIntervalMinutes = finite(instrument.fundingInterval, Number.MIN_VALUE);
  if (fundingIntervalMinutes === undefined) return unavailable(symbol, "malformed_response", now, "Bybit instrument funding interval failed validation.");
  return { fundingIntervalMinutes };
}

export async function fetchSnapshot(rawSymbol: string, options: SnapshotOptions = {}): Promise<SnapshotResult> {
  const symbol = rawSymbol.toUpperCase();
  const now = options.now ?? Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  if (!SUPPORTED_SYMBOLS.includes(symbol as SupportedSymbol)) return unavailable(symbol, "unsupported_pair", now, "This pair is outside the public scanner allowlist.");
  const supported = symbol as SupportedSymbol;
  const endpoints = [
    `${BINANCE_BASE}/fapi/v1/premiumIndex?symbol=${supported}`,
    `${BINANCE_BASE}/fapi/v1/depth?symbol=${supported}&limit=50`,
    `${BINANCE_BASE}/fapi/v1/fundingRate?symbol=${supported}&limit=2`,
    `${BINANCE_BASE}/fapi/v1/exchangeInfo`,
    `${BYBIT_BASE}/v5/market/tickers?category=linear&symbol=${supported}`,
    `${BYBIT_BASE}/v5/market/orderbook?category=linear&symbol=${supported}&limit=50`,
    `${BYBIT_BASE}/v5/market/instruments-info?category=linear&symbol=${supported}`,
  ];
  const receiptClock = options.receiptClock ?? (options.now === undefined ? undefined : () => options.now!);
  const responses = await Promise.all(endpoints.map((endpoint) => fetchJson<unknown>(endpoint, fetchImpl, timeoutMs, now, receiptClock)));
  const failure = responses.find(isUnavailable);
  if (failure) return withSymbol(failure, symbol);
  const [binancePremium, binanceDepth, binanceHistory, binanceInstrument, bybitTicker, bybitDepth, bybitInstrument] = responses as Fetched<unknown>[];
  const premium = normalizeBinancePremium(binancePremium.data, binancePremium.provenance, symbol, now);
  const depth = normalizeBinanceDepth(binanceDepth.data, binanceDepth.provenance, symbol, now);
  const historyCadence = normalizeBinanceHistory(binanceHistory.data, binanceHistory.provenance, symbol, now);
  const binanceInstrumentResult = normalizeBinanceInstrument(binanceInstrument.data, symbol, now);
  const ticker = normalizeBybitTicker(bybitTicker.data, bybitTicker.provenance, symbol, now);
  const bybitBook = normalizeBybitDepth(bybitDepth.data, bybitDepth.provenance, symbol, now);
  const bybitInstrumentResult = normalizeBybitInstrument(bybitInstrument.data, symbol, now);
  const normalized = [premium, depth, historyCadence, binanceInstrumentResult, ticker, bybitBook, bybitInstrumentResult];
  const normalizedFailure = normalized.find(isUnavailable);
  if (normalizedFailure) return normalizedFailure;
  const [binance, binanceBook, binanceHoursObject, _binanceInstrument, bybit, bybitBookData, bybitInstrumentData] = normalized as [
    { markPrice: number; rate: number; nextFundingTime: number; sourceTime: number },
    { bids: [number, number][]; asks: [number, number][]; sourceTime: number },
    { cadence: number; lastSettledFundingRate: number | undefined; lastSettledAt: string },
    { valid: true },
    { rate: number; interval: number; markPrice: number; bid: number; ask: number; sourceTime: number },
    { bids: [number, number][]; asks: [number, number][]; sourceTime: number },
    { fundingIntervalMinutes: number },
  ];
  const binanceHours = binanceHoursObject.cadence;
  if (Math.abs(binanceHours - bybit.interval) > 0.01 || Math.abs(binanceHours * 60 - bybitInstrumentData.fundingIntervalMinutes) > 0.01) return unavailable(symbol, "cadence_mismatch", now, "Funding intervals are not comparable for this snapshot.");
  if (Math.abs(binance.sourceTime - bybit.sourceTime) > MAX_TICKER_SKEW_MS) return unavailable(symbol, "source_timestamp_skew", now, "Venue ticker timestamps are too far apart for one snapshot.");
  const highVenue: Venue = binance.rate >= bybit.rate ? "Binance" : "Bybit";
  const lowVenue: Venue = highVenue === "Binance" ? "Bybit" : "Binance";
  const highBook = highVenue === "Binance" ? binanceBook : bybitBookData;
  const lowBook = lowVenue === "Binance" ? binanceBook : bybitBookData;
  const highBid = depthImpactBps(highBook.bids, MODEL_ASSUMPTIONS.notionalUsd, "bid");
  const lowAsk = depthImpactBps(lowBook.asks, MODEL_ASSUMPTIONS.notionalUsd, "ask");
  if (highBid === undefined || lowAsk === undefined) return unavailable(symbol, "insufficient_depth", now, "Both public books must cover the modeled notional.");
  const input: OpportunityInput = {
    symbol,
    binance: { venue: "Binance", rate: binance.rate, markPrice: binance.markPrice, bid: binanceBook.bids[0][0], ask: binanceBook.asks[0][0], updatedAt: binance.sourceTime },
    bybit: { venue: "Bybit", rate: bybit.rate, markPrice: bybit.markPrice, bid: bybit.bid, ask: bybit.ask, updatedAt: bybit.sourceTime },
    notionalUsd: MODEL_ASSUMPTIONS.notionalUsd,
    roundTripFeeBps: MODEL_ASSUMPTIONS.roundTripFeeBps,
    depthSlippageBps: highBid + lowAsk,
    transferReserveBps: MODEL_ASSUMPTIONS.transferReserveBps,
    liquidationBufferBps: MODEL_ASSUMPTIONS.liquidationBufferBps,
  };
  const { calculateOpportunity } = await import("./edge");
  const sourceProvenance = { binance: [binancePremium.provenance, binanceDepth.provenance, binanceHistory.provenance, binanceInstrument.provenance], bybit: [bybitTicker.provenance, bybitDepth.provenance, bybitInstrument.provenance] };
  const sourceHashes = [...sourceProvenance.binance, ...sourceProvenance.bybit].map((source) => source.payloadSha256).join(":");
  const receiptTimes = [...sourceProvenance.binance, ...sourceProvenance.bybit].map((source) => Date.parse(source.capturedAt));
  const completedAt = Math.max(...receiptTimes.filter(Number.isFinite));
  const completedCaptureAt = Number.isFinite(completedAt) ? completedAt : now;
  const completedModel = calculateOpportunity(input, completedCaptureAt);
  return {
    kind: "available",
    symbol: supported,
    capturedAt: new Date(completedCaptureAt).toISOString(),
    snapshotId: `sha256:${hashPayload(sourceHashes)}`,
    cadence: { binanceHours, bybitHours: bybit.interval, comparable: true },
    sources: sourceProvenance,
    market: {
      binance: { venue: "Binance", currentQuotedFundingRate: binance.rate, markPrice: binance.markPrice, bid: input.binance.bid, ask: input.binance.ask, fundingIntervalHours: binanceHours, fundingLabel: "venue-reported ticker funding rate", lastSettledFundingRate: binanceHoursObject.lastSettledFundingRate, lastSettledAt: binanceHoursObject.lastSettledAt },
      bybit: { venue: "Bybit", currentQuotedFundingRate: bybit.rate, markPrice: bybit.markPrice, bid: bybit.bid, ask: bybit.ask, fundingIntervalHours: bybit.interval, fundingLabel: "venue-reported ticker funding rate" },
    },
    model: completedModel,
  };
}

const SNAPSHOT_CACHE_TTL_MS = 15_000;
const SNAPSHOT_CACHE_LIMIT = SUPPORTED_SYMBOLS.length;
type CacheEntry = { expiresAt: number; result: Promise<SnapshotResult> };
const runtimeSnapshotCache = new Map<SupportedSymbol, CacheEntry>();

/** Per-runtime cache only. This is not durable, shared, or a historical feed. */
export function clearSnapshotCache() {
  runtimeSnapshotCache.clear();
}

export function getCachedSnapshot(rawSymbol: string, options: SnapshotOptions = {}): Promise<SnapshotResult> {
  const symbol = rawSymbol.toUpperCase();
  // Injected clocks/fetchers are test seams and must never enter the runtime cache.
  if (options.fetchImpl || options.now !== undefined || options.timeoutMs !== undefined || options.receiptClock) return fetchSnapshot(symbol, options);
  if (!SUPPORTED_SYMBOLS.includes(symbol as SupportedSymbol)) return fetchSnapshot(symbol);
  const supported = symbol as SupportedSymbol;
  const now = Date.now();
  const cached = runtimeSnapshotCache.get(supported);
  if (cached && cached.expiresAt > now) return cached.result;
  if (cached) runtimeSnapshotCache.delete(supported);
  while (runtimeSnapshotCache.size >= SNAPSHOT_CACHE_LIMIT) {
    const oldest = runtimeSnapshotCache.keys().next().value as SupportedSymbol | undefined;
    if (!oldest) break;
    runtimeSnapshotCache.delete(oldest);
  }
  const result = fetchSnapshot(supported);
  runtimeSnapshotCache.set(supported, { expiresAt: now + SNAPSHOT_CACHE_TTL_MS, result });
  return result;
}
