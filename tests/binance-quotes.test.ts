import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../lib/universe", () => ({ getCachedUniverse: vi.fn() }));

import { getCachedUniverse } from "../lib/universe";
import { getBinanceQuotes, validateBinanceQuoteBatch } from "../lib/binance-quotes";

const NOW = Date.parse("2026-08-17T08:00:00.000Z");

describe("Binance live quote fallback", () => {
  it("accepts fresh REST quotes for the server-selected universe", async () => {
    vi.mocked(getCachedUniverse).mockResolvedValue({
      kind: "available",
      generatedAt: new Date(NOW).toISOString(),
      maxPairs: 25,
      pairs: [{ symbol: "BTCUSDT", baseAsset: "BTC", fundingIntervalHours: 8, binanceQuoteVolumeUsd: 10, bybitQuoteVolumeUsd: 9, commonQuoteVolumeUsd: 9 }],
      sources: { binance: [], bybit: [] },
    });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([
      { symbol: "BTCUSDT", markPrice: "100", lastFundingRate: "0.001", time: NOW - 1_000 },
      { symbol: "NOT_ALLOWED", markPrice: "999", lastFundingRate: "0.9", time: NOW - 1_000 },
    ]), { status: 200 })) as typeof fetch;

    const result = await getBinanceQuotes({ now: NOW, fetchImpl });

    expect(result).toMatchObject({ kind: "available", quotes: [{ symbol: "BTCUSDT", markPrice: 100, rate: 0.001, updatedAt: NOW - 1_000 }] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails closed for stale, future, malformed, or duplicate quote records", () => {
    expect(validateBinanceQuoteBatch([
      { symbol: "BTCUSDT", markPrice: "100", lastFundingRate: "0.001", time: NOW - 16_000 },
      { symbol: "ETHUSDT", markPrice: "100", lastFundingRate: "0.001", time: NOW + 6_000 },
      { symbol: "SOLUSDT", markPrice: "not-a-number", lastFundingRate: "0.001", time: NOW - 1_000 },
      { symbol: "BTCUSDT", markPrice: "101", lastFundingRate: "0.002", time: NOW - 1_000 },
    ], ["BTCUSDT", "ETHUSDT", "SOLUSDT"], NOW)).toBeUndefined();
  });
});
