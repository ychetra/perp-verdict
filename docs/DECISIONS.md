# Architecture decisions

## Why a Next.js client shell

The public app needs a shareable route, strong initial rendering, and a responsive client-side market surface. The first build uses a small Next.js/React/TypeScript shell with zero user identity or database dependency.

## Why direct public streams in v0.1

Public WebSocket streams make the live-data boundary obvious and prevent the server from becoming a covert trading gateway. They are suitable for an interactive prototype but do not establish production-quality data reliability.

Before a public production deployment, move connector ingestion to a dedicated read-only server process that:

1. records source timestamp and receipt timestamp separately;
2. validates snapshots, deltas, sequence gaps, and reconnects;
3. produces a versioned normalized snapshot;
4. serves the browser through a rate-limited public read API; and
5. never holds trading credentials.

The share-card milestone adds a narrow server-only REST snapshot rather than a persistent feed service. It validates Binance premium/depth/funding history/exchangeInfo and Bybit ticker/order book/instruments-info on demand, records response provenance and hashes in the returned card, and uses a bounded process-local cache for about 15 seconds. Live source timestamps must be within 15 seconds and venue ticker timestamps within 15 seconds of each other. The cache is not durable, globally shared, or a historical feed.

## Regional upstream compatibility

Vercel dynamic Functions are pinned to Singapore (`sin1`) because Binance can return HTTP 451 from some production regions even when the same public GET is reachable locally. This is a routing compatibility measure only: no proxy or alternate provider is introduced. Any upstream error still returns the explicit unavailable result and the app remains read-only/fail-closed.

## Truthful fallbacks

The UI begins with a conservative seed state so a blocked regional endpoint does not leave a blank application. It labels a partially connected feed and changes to `STALE` after the freshness threshold. A fallback is never called live liquidity.

Server Truth Cards have a stricter boundary: they never use `seedInputs`. A missing source, stale time, unproven cadence, malformed envelope, or insufficient depth renders an unavailable card/image.

## UI implementation choice

The first release uses semantic HTML and CSS rather than a chart library. The scatter map separates raw funding differential from modeled net; its circles scale only when visible book capacity is available. A full table remains the accessible source of truth. If the universe grows beyond a few dozen symbols, use a Canvas/WebGL visualization for the map while preserving the DOM table.

## Security invariant

This codebase must remain observation-only. Any pull request that introduces an exchange credential, signing implementation, private account route, order endpoint, withdrawal/transfer action, executor, or paper-fill simulation violates the product contract.
