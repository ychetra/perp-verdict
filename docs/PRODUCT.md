# Perp Verdict product brief

## Promise

Perp Verdict helps a trader answer one narrow question:

> Does this cross-exchange perpetual funding differential survive the costs we can name?

It is a reality-checking interface, not an execution surface, signal service, or yield guarantee.

## Audience and hierarchy

The first audience is a retail trader who needs a readable go/no-go explanation. The technical evidence is one interaction below the verdict for quants and developers.

1. **Retail layer:** a plain-language verdict, selected direction, fresh/stale state, and cost waterfall.
2. **Evidence layer:** both venue funding inputs, mark prices, notional, exact reserves, and live versus fallback book-impact label.
3. **Technical layer:** documented source contract and deterministic calculation function. Export/API work is intentionally deferred.

## First release scope

- **Venues:** Binance USD-M perpetuals and Bybit USDT linear perpetuals.
- **Pairs:** BTCUSDT, ETHUSDT, SOLUSDT, and XRPUSDT.
- **Access:** no account needed to view, scan, or share a URL.
- **Visual system:** dark/light mode with one semantic color system. Green means “needs review,” not “buy.” Red means modeled costs win. Amber means the input is stale or incomplete.
- **Sharing:** the current interface copies the public URL. Versioned, server-stored Reality Cards come only after the calculation snapshot has a durable provenance format.

## Interaction principles

- Plot position separates raw funding differential from modeled net. Circle size uses visible capacity only when both streamed books can cover the configured notional.
- Circle color communicates the verdict. The accessible table repeats every result outside the visualization.
- Motion is limited to selection/data changes and respects reduced-motion preferences.
- Each selected pair opens the arithmetic. There is no hidden score.
- A stale public feed changes the result to `STALE`; it cannot remain green.

## Explicit non-goals

- No exchange authentication or private account state.
- No order, transfer, wallet, signature, or paper-trade code path.
- No annualized-return headline as the primary output.
- No assertion of real executable liquidity until both leg books and venue-specific fee inputs have been validated.
