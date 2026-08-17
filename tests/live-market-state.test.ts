import { describe, expect, it } from "vitest";
import { hasLiveVenuePair } from "../lib/live-market-state";

const quote = { rate: 0.001, markPrice: 100, bid: 99, ask: 101 };
const book = { bids: [[99, 1]], asks: [[101, 1]] };

describe("live venue state", () => {
  it("requires quote and book for the same active symbol", () => {
    expect(hasLiveVenuePair(["BTCUSDT", "ETHUSDT"], { BTCUSDT: { Binance: quote } }, { ETHUSDT: { Binance: book } }, "Binance")).toBe(false);
    expect(hasLiveVenuePair(["BTCUSDT", "ETHUSDT"], { BTCUSDT: { Binance: quote } }, { BTCUSDT: { Binance: book } }, "Binance")).toBe(true);
  });

  it("requires Bybit ticker bid and ask in addition to its book", () => {
    expect(hasLiveVenuePair(["BTCUSDT"], { BTCUSDT: { Bybit: { rate: quote.rate, markPrice: quote.markPrice } } }, { BTCUSDT: { Bybit: book } }, "Bybit")).toBe(false);
    expect(hasLiveVenuePair(["BTCUSDT"], { BTCUSDT: { Bybit: quote } }, { BTCUSDT: { Bybit: book } }, "Bybit")).toBe(true);
  });
});
