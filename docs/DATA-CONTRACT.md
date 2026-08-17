# Data and calculation contract

## Public inputs only

The browser connects only to public market-data WebSockets for the interactive scanner. Shareable cards and `/api/verdict/[pair]` use a server-only, GET-only REST snapshot:

- Binance `premiumIndex`, `depth`, `fundingRate?limit=2`, and `exchangeInfo` endpoints.
- Bybit V5 linear `tickers`, level-50 `orderbook`, and `instruments-info` endpoints.

Each REST response records its endpoint, response time, receipt time, venue timestamp when available, and SHA-256 hash of the raw response text. A combined snapshot ID identifies the exact validated response set. No response is persisted.

- Binance USD-M Futures combined streams: mark price/funding and top-20 partial book streams.
- Bybit V5 linear public stream: ticker and level-50 order-book topics.

No endpoint in this repository needs or accepts an API key. Do not add private streams, order-entry channels, account balances, transfer requests, or credentials to this application.

Official implementation references:

- [Binance Futures developer catalog](https://developers.binance.com/en/docs/catalog)
- [Binance USD-M mark price stream](https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Mark-Price-Stream)
- [Bybit public WebSocket connection](https://bybit-exchange.github.io/docs/v5/ws/connect)
- [Bybit order-book snapshot and delta semantics](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook)
- [Bybit linear ticker fields](https://bybit-exchange.github.io/docs/v5/websocket/public/ticker)

## Normalized input shape

Every venue leg uses:

```ts
{
  venue: "Binance" | "Bybit",
  rate: number,       // funding fraction per venue funding interval
  markPrice: number,
  bid: number,
  ask: number,
  updatedAt: number   // source event time in milliseconds
}
```

The app calculates a direction by shorting the venue with the higher current funding rate and longing the other venue. This is an explanatory model; it is not order advice.

## Formula

For one displayed funding interval:

```text
grossFundingBps = abs(binanceFundingRate - bybitFundingRate) * 10,000
totalCostBps = roundTripFeeBps
             + depthSlippageBps
             + transferReserveBps
             + liquidationBufferBps
modeledNetBps = grossFundingBps - totalCostBps
```

`depthSlippageBps` uses both REST books when both sides cover the configured notional. Missing or insufficient depth returns an unavailable result; it never becomes zero impact or a seed fallback. The share-card model keeps fee, transfer, and liquidation reserves explicit and separate from source market data.

Funding rates are venue-reported ticker values: Binance `lastFundingRate` from premium-index and Bybit ticker `fundingRate`. Binance's `fundingRate` history is used to observe the settled cadence and expose the latest settled value separately; it is not silently substituted for the current ticker value. Instrument metadata must identify a trading USDT-margined perpetual on both venues, and Bybit instrument cadence must agree with its ticker cadence. If observed Binance and Bybit funding intervals differ, the snapshot is unavailable rather than comparing incomparable raw rates.

Binance history cadence is normalized to whole minutes only when timestamp jitter is at most 0.25 minutes; millisecond-level jitter therefore renders as `8h`, while material timestamp jitter fails closed.

## Verdicts

| Verdict | Condition | Meaning |
| --- | --- | --- |
| `REVIEW` | fresh and `modeledNetBps > 0` | Worth independently verifying; not an execution signal. |
| `REJECT` | fresh and `modeledNetBps <= 0` | Declared costs erase the differential. |
| `STALE` | either source is older than 12 seconds | Do not interpret the modeled result. |

## Server snapshot boundary

The API and card routes are dynamic, noindex, and use a bounded roughly 15-second per-runtime cache wrapper. Live premium, ticker, and depth timestamps older than 15 seconds are rejected; venue ticker timestamps more than 15 seconds apart return `source_timestamp_skew`. The cache is process-local, not durable or globally shared, and does not establish a persistent feed. They return public source/provenance/model fields only. Timeout, HTTP error, malformed/instrument response, invalid/stale source time, cadence mismatch, timestamp skew, unsupported pair, or insufficient depth fails closed with an explicit unavailable result. There is no API key, signing, account state, wallet, order, transfer, fill, or persistence path.

## Known boundaries

- The two venue funding intervals may differ; server Truth Cards only model snapshots after verifying comparable observed cadence. The interactive display still labels its value “per funding interval” and must not compare annualized values as though the timings were identical.
- Fee tiers, transfer paths/times, maintenance margin, funding caps, and liquidation prices are account- and venue-specific. They remain explicit assumptions, not claims of user-specific truth.
- Books are market data, not fill confirmations. A top-N book can disappear before an order reaches it.
- A persistent feed must implement reconnect, sequence validation, rate-limit handling, source monitoring, and snapshot provenance before production publication.
