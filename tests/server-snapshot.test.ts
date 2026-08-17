import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clearSnapshotCache, fetchSnapshot, getCachedSnapshot } from "../lib/server-snapshot";

const NOW = Date.parse("2026-08-17T03:00:00.000Z");

function payloads({ cadence = 8, depth = true, malformed = false, httpError = false, instrumentBad = false, skewMs = 0, staleMs = 0, historyJitterMs = 0 } = {}) {
  const commonDepth = depth ? [["100", "200"]] : [["100", "1"]];
  return new Map<string, unknown>([
    ["premiumIndex", { symbol: "BTCUSDT", markPrice: "100", lastFundingRate: "0.001", nextFundingTime: NOW + 28_800_000, time: NOW - staleMs - 1_000 - skewMs }],
    ["depth", { E: NOW - staleMs - 1_000, T: NOW - staleMs - 1_000, bids: commonDepth, asks: commonDepth }],
    ["fundingRate", [{ fundingTime: NOW - 28_800_000, fundingRate: "0.001" }, { fundingTime: NOW - 57_600_000 + historyJitterMs, fundingRate: "0.001" }]],
    ["exchangeInfo", { symbols: [{ symbol: "BTCUSDT", contractType: instrumentBad ? "PERPETUAL" : "PERPETUAL", status: instrumentBad ? "BREAK" : "TRADING", quoteAsset: "USDT", marginAsset: "USDT" }] }],
    ["tickers", { retCode: 0, result: { list: [{ symbol: "BTCUSDT", fundingRate: "0.0002", fundingIntervalHour: String(cadence), markPrice: "100", bid1Price: "99.9", ask1Price: "100.1" }] }, time: NOW - staleMs - 800 + skewMs }],
    ["orderbook", { retCode: 0, result: { ts: String(NOW - staleMs - 700), cts: String(NOW - staleMs - 700), b: [["100", "200"]], a: [["100", "200"]] } }],
    ["instrument", { retCode: 0, result: { list: [{ symbol: "BTCUSDT", contractType: instrumentBad ? "Inverse" : "LinearPerpetual", status: "Trading", quoteCoin: "USDT", settleCoin: "USDT", fundingInterval: String(cadence * 60) }] } }],
    ["malformed", malformed ? {} : null],
    ["httpError", httpError ? { status: 503 } : null],
  ]);
}

function mockedFetch(options: Parameters<typeof payloads>[0] = {}) {
  const data = payloads(options);
  return vi.fn(async (url: string) => {
    const key = url.includes("exchangeInfo") ? "exchangeInfo" : url.includes("instruments-info") ? "instrument" : url.includes("premiumIndex") ? "premiumIndex" : url.includes("/depth?") ? "depth" : url.includes("fundingRate") ? "fundingRate" : url.includes("tickers") ? "tickers" : "orderbook";
    if (data.get("httpError") && key === "tickers") return new Response("upstream failure", { status: 503 });
    if (data.get("malformed") && key === "tickers") return new Response(JSON.stringify(data.get("malformed")), { status: 200 });
    return new Response(JSON.stringify(data.get(key)), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
}

describe("server funding snapshots", () => {
  it("models a validated public snapshot with hashes and observed cadence", async () => {
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch() });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") return;
    expect(result.cadence).toEqual({ binanceHours: 8, bybitHours: 8, comparable: true });
    expect(result.snapshotId).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.sources.binance.every((source) => /^sha256:[a-f0-9]{64}$/.test(`sha256:${source.payloadSha256}`))).toBe(true);
    expect(result.market.binance.currentQuotedFundingRate).toBe(0.001);
    expect(result.market.binance.lastSettledFundingRate).toBe(0.001);
    expect(result.market.binance.lastSettledAt).toBe("2026-08-16T19:00:00.000Z");
    expect(result.sources.binance.every((source) => source.capturedAt === "2026-08-17T03:00:00.000Z")).toBe(true);
    expect(result.capturedAt).toBe("2026-08-17T03:00:00.000Z");
    expect(result.model.binance.markPrice).toBe(100);
    expect(result.model.depthSlippageBps).toBe(0);
  });

  it("fails closed when funding cadence cannot be compared", async () => {
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ cadence: 4 }) });
    expect(result).toMatchObject({ kind: "unavailable", reason: "cadence_mismatch" });
  });

  it("normalizes millisecond cadence jitter but rejects material jitter", async () => {
    const jittered = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ historyJitterMs: 1 }) });
    expect(jittered).toMatchObject({ kind: "available", cadence: { binanceHours: 8 } });
    const material = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ historyJitterMs: 20_000 }) });
    expect(material).toMatchObject({ kind: "unavailable", reason: "cadence_mismatch" });
  });

  it("requires matching perpetual USDT instrument metadata", async () => {
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ instrumentBad: true }) });
    expect(result).toMatchObject({ kind: "unavailable", reason: "malformed_response" });
  });

  it("fails closed on stale live sources and ticker timestamp skew", async () => {
    await expect(fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ staleMs: 16_000 }) })).resolves.toMatchObject({ kind: "unavailable", reason: "invalid_source_time" });
    await expect(fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ skewMs: 10_000 }) })).resolves.toMatchObject({ kind: "unavailable", reason: "source_timestamp_skew" });
  });

  it("fails closed on malformed or HTTP error envelopes", async () => {
    await expect(fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ malformed: true }) })).resolves.toMatchObject({ kind: "unavailable", reason: "malformed_response" });
    await expect(fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ httpError: true }) })).resolves.toMatchObject({ kind: "unavailable", reason: "http_error" });
  });

  it("does not turn insufficient depth into zero impact", async () => {
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch({ depth: false }) });
    expect(result).toMatchObject({ kind: "unavailable", reason: "insufficient_depth" });
  });

  it("does not use the old seed market data", async () => {
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch() });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") return;
    expect(result.model.binance.markPrice).not.toBe(103_882);
    expect(result.capturedAt).toBe("2026-08-17T03:00:00.000Z");
  });

  it("reuses a per-runtime cache entry and never caches injected test fetches", async () => {
    clearSnapshotCache();
    const fetcher = mockedFetch();
    vi.stubGlobal("fetch", fetcher);
    await getCachedSnapshot("BTCUSDT");
    await getCachedSnapshot("BTCUSDT");
    expect(fetcher).toHaveBeenCalledTimes(7);
    clearSnapshotCache();
    vi.unstubAllGlobals();
    const injected = mockedFetch();
    await getCachedSnapshot("BTCUSDT", { now: NOW, fetchImpl: injected });
    await getCachedSnapshot("BTCUSDT", { now: NOW, fetchImpl: injected });
    expect(injected).toHaveBeenCalledTimes(14);
  });

  it("derives capture time from the latest injected response receipt", async () => {
    let receipt = 0;
    const result = await fetchSnapshot("BTCUSDT", { now: NOW, fetchImpl: mockedFetch(), receiptClock: () => NOW + (++receipt * 1_000) });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") return;
    expect(result.capturedAt).toBe("2026-08-17T03:00:07.000Z");
    expect(Math.max(...result.sources.binance.concat(result.sources.bybit).map((source) => Date.parse(source.capturedAt)))).toBe(Date.parse(result.capturedAt));
  });
});
