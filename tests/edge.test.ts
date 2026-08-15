import { describe, expect, it } from "vitest";
import { calculateOpportunity } from "../lib/edge";
import type { OpportunityInput } from "../lib/types";

const input: OpportunityInput = {
  symbol: "BTCUSDT",
  binance: { venue: "Binance", rate: 0.001, markPrice: 100, bid: 99, ask: 101, updatedAt: 1_000 },
  bybit: { venue: "Bybit", rate: 0.0002, markPrice: 100, bid: 99, ask: 101, updatedAt: 1_000 },
  notionalUsd: 10_000,
  roundTripFeeBps: 3,
  depthSlippageBps: 1,
  transferReserveBps: 1,
  liquidationBufferBps: 1,
};

describe("calculateOpportunity", () => {
  it("subtracts every declared reserve from the funding differential", () => {
    const result = calculateOpportunity(input, 2_000);
    expect(result.grossFundingBps).toBeCloseTo(8);
    expect(result.totalCostBps).toBe(6);
    expect(result.modeledNetBps).toBeCloseTo(2);
    expect(result.direction).toBe("Short Binance, long Bybit");
    expect(result.status).toBe("watch");
  });

  it("rejects a result when conservative costs exceed the differential", () => {
    const result = calculateOpportunity({ ...input, depthSlippageBps: 7 }, 2_000);
    expect(result.modeledNetBps).toBeCloseTo(-4);
    expect(result.status).toBe("rejected");
  });

  it("does not call stale data a trade", () => {
    const result = calculateOpportunity(input, 20_000);
    expect(result.status).toBe("stale");
  });
});
