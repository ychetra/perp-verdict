import type { OpportunityInput } from "./types";

const now = Date.now();

export const seedInputs: OpportunityInput[] = [
  {
    symbol: "BTCUSDT",
    binance: { venue: "Binance", rate: 0.00074, markPrice: 103_882, bid: 103_879, ask: 103_884, updatedAt: now },
    bybit: { venue: "Bybit", rate: 0.00029, markPrice: 103_897, bid: 103_893, ask: 103_901, updatedAt: now },
    notionalUsd: 10_000,
    roundTripFeeBps: 12,
    depthSlippageBps: 2.8,
    transferReserveBps: 4,
    liquidationBufferBps: 9,
  },
  {
    symbol: "ETHUSDT",
    binance: { venue: "Binance", rate: 0.00036, markPrice: 2_514, bid: 2_513.7, ask: 2_514.2, updatedAt: now },
    bybit: { venue: "Bybit", rate: -0.00007, markPrice: 2_515, bid: 2_514.7, ask: 2_515.3, updatedAt: now },
    notionalUsd: 10_000,
    roundTripFeeBps: 12,
    depthSlippageBps: 3.1,
    transferReserveBps: 4,
    liquidationBufferBps: 9,
  },
  {
    symbol: "SOLUSDT",
    binance: { venue: "Binance", rate: 0.00088, markPrice: 158.1, bid: 158.08, ask: 158.12, updatedAt: now },
    bybit: { venue: "Bybit", rate: 0.00019, markPrice: 158.23, bid: 158.2, ask: 158.27, updatedAt: now },
    notionalUsd: 10_000,
    roundTripFeeBps: 12,
    depthSlippageBps: 5.2,
    transferReserveBps: 4,
    liquidationBufferBps: 9,
  },
  {
    symbol: "XRPUSDT",
    binance: { venue: "Binance", rate: 0.00012, markPrice: 2.16, bid: 2.159, ask: 2.161, updatedAt: now },
    bybit: { venue: "Bybit", rate: 0.0001, markPrice: 2.16, bid: 2.159, ask: 2.161, updatedAt: now },
    notionalUsd: 10_000,
    roundTripFeeBps: 12,
    depthSlippageBps: 7.3,
    transferReserveBps: 4,
    liquidationBufferBps: 9,
  },
];
