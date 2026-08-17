import { calculateOpportunity } from "./edge";
import { seedInputs } from "./sample-data";
import type { Opportunity } from "./types";

export const VERDICT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT"] as const;
export type VerdictSymbol = (typeof VERDICT_SYMBOLS)[number];

export const VERDICT_SNAPSHOT_AT = "2026-01-01T00:00:00.000Z";
const staticSnapshotAt = Date.parse(VERDICT_SNAPSHOT_AT);

export const VERDICT_CONTEXT = "Fixed demo fixture snapshot using Binance and Bybit funding inputs with declared fee, depth, transfer-time, and liquidation reserves.";
export const VERDICT_DISCLAIMER = "MODELED / NOT EXECUTABLE. This page is a static read-only calculation, not a fill, guarantee, or recommendation.";

export function getVerdict(symbol: string): Opportunity | undefined {
  const input = seedInputs.find((item) => item.symbol === symbol.toUpperCase());
  if (!input) return undefined;
  const fixtureInput = {
    ...input,
    binance: { ...input.binance, updatedAt: staticSnapshotAt },
    bybit: { ...input.bybit, updatedAt: staticSnapshotAt },
  };
  return calculateOpportunity(fixtureInput, staticSnapshotAt);
}

export function isVerdictSymbol(symbol: string): symbol is VerdictSymbol {
  return VERDICT_SYMBOLS.includes(symbol.toUpperCase() as VerdictSymbol);
}

export function getVerdictTimestamp(verdict: Opportunity) {
  return new Date(Math.min(verdict.binance.updatedAt, verdict.bybit.updatedAt));
}

export function getVerdictFreshness(verdict: Opportunity) {
  return verdict.freshnessMs <= 0 ? "fixed fixture snapshot" : `${Math.round(verdict.freshnessMs / 1000)}s at fixture snapshot`;
}
