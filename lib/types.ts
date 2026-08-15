export type Venue = "Binance" | "Bybit";

export type FundingLeg = {
  venue: Venue;
  rate: number;
  markPrice: number;
  bid: number;
  ask: number;
  updatedAt: number;
};

export type OpportunityInput = {
  symbol: string;
  binance: FundingLeg;
  bybit: FundingLeg;
  notionalUsd: number;
  roundTripFeeBps: number;
  depthSlippageBps: number;
  transferReserveBps: number;
  liquidationBufferBps: number;
};

export type Opportunity = OpportunityInput & {
  grossFundingBps: number;
  totalCostBps: number;
  modeledNetBps: number;
  direction: string;
  higherFundingVenue: Venue;
  freshnessMs: number;
  status: "watch" | "rejected" | "stale";
};
