import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { applyBinanceFundingOverrides, filterBinanceInstruments, filterBinanceVolumes, filterBybitInstruments, filterBybitVolumes, intersectAndSelectPairs, normalizeBaseAsset } from "../lib/universe";

describe("multipair universe validation", () => {
  it("normalizes base assets without fuzzy matching", () => {
    expect(normalizeBaseAsset(" eth ")).toBe("ETH");
    expect(normalizeBaseAsset("ETH/USDT")).toBeUndefined();
    expect(normalizeBaseAsset("1000PEPE")).toBe("1000PEPE");
  });

  it("keeps only active Binance USDT perpetuals and applies funding overrides", () => {
    const instruments = filterBinanceInstruments({ symbols: [
      { symbol: "BTCUSDT", baseAsset: "BTC", contractType: "PERPETUAL", status: "TRADING", quoteAsset: "USDT", marginAsset: "USDT" },
      { symbol: "ETHUSDT", baseAsset: "ETH", contractType: "PERPETUAL", status: "BREAK", quoteAsset: "USDT", marginAsset: "USDT" },
      { symbol: "ETHUSD", baseAsset: "ETH", contractType: "PERPETUAL", status: "TRADING", quoteAsset: "USD", marginAsset: "USD" },
    ] });
    expect(instruments).toHaveLength(1);
    expect(applyBinanceFundingOverrides(instruments ?? [], [{ symbol: "BTCUSDT", fundingIntervalHours: 4 }])).toEqual([{ symbol: "BTCUSDT", baseAsset: "BTC", fundingIntervalHours: 4 }]);
  });

  it("handles paginated Bybit linear perpetual metadata", () => {
    const page = filterBybitInstruments({ retCode: 0, result: { nextPageCursor: "next", list: [
      { symbol: "BTCUSDT", baseCoin: "BTC", contractType: "LinearPerpetual", status: "Trading", quoteCoin: "USDT", settleCoin: "USDT", fundingInterval: "240" },
      { symbol: "ETHUSDT", baseCoin: "ETH", contractType: "InversePerpetual", status: "Trading", quoteCoin: "USDT", settleCoin: "USDT", fundingInterval: "480" },
    ] } });
    expect(page).toEqual({ instruments: [{ symbol: "BTCUSDT", baseAsset: "BTC", fundingIntervalHours: 4 }], nextPageCursor: "next" });
  });

  it("intersects exact symbols and cadence, then ranks by common volume", () => {
    const binance = [
      { symbol: "BTCUSDT", baseAsset: "BTC", fundingIntervalHours: 8 },
      { symbol: "ETHUSDT", baseAsset: "ETH", fundingIntervalHours: 8 },
      { symbol: "SOLUSDT", baseAsset: "SOL", fundingIntervalHours: 8 },
    ];
    const bybit = [
      { symbol: "BTCUSDT", baseAsset: "BTC", fundingIntervalHours: 8 },
      { symbol: "ETHUSDT", baseAsset: "ETH", fundingIntervalHours: 4 },
      { symbol: "SOLUSDT", baseAsset: "OTHER", fundingIntervalHours: 8 },
    ];
    const pairs = intersectAndSelectPairs(binance, bybit, [
      { symbol: "BTCUSDT", quoteVolumeUsd: 100 },
      { symbol: "ETHUSDT", quoteVolumeUsd: 1_000 },
      { symbol: "SOLUSDT", quoteVolumeUsd: 10_000 },
    ], [
      { symbol: "BTCUSDT", quoteVolumeUsd: 90 },
      { symbol: "ETHUSDT", quoteVolumeUsd: 900 },
      { symbol: "SOLUSDT", quoteVolumeUsd: 9_000 },
    ], 25);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ symbol: "BTCUSDT", commonQuoteVolumeUsd: 90 });
  });

  it("limits selection to 25 pairs and never invents missing volume", () => {
    const instruments = Array.from({ length: 30 }, (_, index) => ({ symbol: `X${index}USDT`, baseAsset: `X${index}`, fundingIntervalHours: 8 }));
    const volumes = instruments.map((item, index) => ({ symbol: item.symbol, quoteVolumeUsd: index + 1 }));
    const pairs = intersectAndSelectPairs(instruments, instruments, volumes, volumes, 99);
    expect(pairs).toHaveLength(25);
    expect(pairs[0].symbol).toBe("X29USDT");
    expect(intersectAndSelectPairs(instruments, instruments, volumes.slice(0, 1), volumes, 25)).toHaveLength(1);
    expect(filterBinanceVolumes([{ symbol: "BTCUSDT", quoteVolume: "0" }])).toEqual([]);
    expect(filterBybitVolumes({ retCode: 0, result: { list: [{ symbol: "BTCUSDT", turnover24h: "0" }] } })).toEqual([]);
    expect(filterBinanceVolumes({ nope: true })).toBeUndefined();
    expect(filterBybitVolumes({ retCode: 1 })).toBeUndefined();
  });
});
