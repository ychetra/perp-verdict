# Perp Verdict

**Perp Verdict** is a live perpetual funding arbitrage scanner that exposes the modeled net result after fees, visible depth, transfer time, and liquidation buffer.

It is deliberately designed to make attractive headline funding rates harder to trust. The scanner compares Binance and Bybit perpetuals, then subtracts declared round-trip fees, order-book impact, a transfer-time reserve, and a liquidation buffer before it shows a modeled net result.

## What is included

- Guest-first public interface with no exchange keys, accounts, or trading controls.
- Dark/light mode, defaulting to light and saving a manual dark/light choice.
- Near-live public WebSocket adapters for Binance USD-M Futures and Bybit linear perpetuals.
- Shareable `/verdict/[pair]` cards and `/api/verdict/[pair]` responses use server-only, source-stamped Binance/Bybit REST snapshots with a bounded 15-second per-runtime cache. It is not durable, globally shared, or a historical feed.
- A retail-first scatter map and accessible table that share one calculation model.
- An expandable cost waterfall, freshness state, and explicit `REVIEW`, `REJECT`, or `STALE` result.
- Unit tests that prove every configured cost is subtracted and stale data cannot produce a positive verdict.

## What is intentionally not included

- Order placement, API keys, withdrawal/transfer requests, signing, wallet connection, paper fills, or a profit promise.
- A claim that a displayed opportunity is executable. A positive result means “verify further,” not “trade.”

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

```bash
npm test
npm run lint
npm run build
```

## Implementation note

The interactive UI starts with conservative seed assumptions so it remains usable when a public venue stream is unavailable. Shareable Truth Cards never use those seeds: their server-only REST snapshot validates both venue envelopes, trading perpetual instrument metadata, source timestamps, 15-second freshness, ticker skew, observed funding cadence, and enough public depth for the configured notional. Any failed validation returns an unavailable card rather than demo numbers. Venue-reported ticker funding is labeled separately from Binance's latest settled funding history, and all responses are read-only with no persistence or execution boundary.

Read [the product brief](docs/PRODUCT.md), [data contract](docs/DATA-CONTRACT.md), and [architecture decisions](docs/DECISIONS.md) before extending the calculation or connector set.
