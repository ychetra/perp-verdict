import type { Opportunity, OpportunityInput, Venue } from "./types";

const BPS_PER_RATE = 10_000;
const STALE_AFTER_MS = 12_000;

export function calculateOpportunity(input: OpportunityInput, now = Date.now()): Opportunity {
  const binanceHigher = input.binance.rate >= input.bybit.rate;
  const higherFundingVenue: Venue = binanceHigher ? "Binance" : "Bybit";
  const lowerFundingVenue: Venue = binanceHigher ? "Bybit" : "Binance";
  const grossFundingBps = Math.abs(input.binance.rate - input.bybit.rate) * BPS_PER_RATE;
  const totalCostBps =
    input.roundTripFeeBps +
    input.depthSlippageBps +
    input.transferReserveBps +
    input.liquidationBufferBps;
  const freshnessMs = now - Math.min(input.binance.updatedAt, input.bybit.updatedAt);
  const modeledNetBps = grossFundingBps - totalCostBps;
  const status = freshnessMs > STALE_AFTER_MS ? "stale" : modeledNetBps > 0 ? "watch" : "rejected";

  return {
    ...input,
    grossFundingBps,
    totalCostBps,
    modeledNetBps,
    higherFundingVenue,
    direction: `Short ${higherFundingVenue}, long ${lowerFundingVenue}`,
    freshnessMs,
    status,
  };
}

export function formatBps(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)} bp`;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1_000 ? 0 : 2,
  }).format(value);
}

export function formatCadenceHours(value: number) {
  const concise = Math.round(value * 60) / 60;
  return `${Number.isInteger(concise) ? concise : concise.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}h`;
}
