# Data and calculation contract

## Public inputs only

The browser connects only to public market-data WebSockets:

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

`depthSlippageBps` uses the streamed book when both sides are present and sufficient for the selected notional. Until then, it retains a visible conservative fallback model. This prevents an absent book from silently becoming zero impact.

## Verdicts

| Verdict | Condition | Meaning |
| --- | --- | --- |
| `REVIEW` | fresh and `modeledNetBps > 0` | Worth independently verifying; not an execution signal. |
| `REJECT` | fresh and `modeledNetBps <= 0` | Declared costs erase the differential. |
| `STALE` | either source is older than 12 seconds | Do not interpret the modeled result. |

## Known boundaries

- The two venue funding intervals may differ. The current display labels its value “per funding interval” and must not compare annualized values as though the timings were identical.
- Fee tiers, transfer paths/times, maintenance margin, funding caps, and liquidation prices are account- and venue-specific. They remain explicit assumptions, not claims of user-specific truth.
- Books are market data, not fill confirmations. A top-N book can disappear before an order reaches it.
- A persistent feed must implement reconnect, sequence validation, rate-limit handling, source monitoring, and snapshot provenance before production publication.
