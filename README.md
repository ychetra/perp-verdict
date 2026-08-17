# Perp Verdict

<p align="center">
  <img src="https://perp.chetra.xyz/icon.svg" width="72" height="72" alt="Perp Verdict mark">
</p>

<h3 align="center">Funding spreads, net of costs.</h3>

<p align="center">
  A public, read-only scanner for perpetual funding differentials across Binance and Bybit.
  <br>
  <a href="https://perp.chetra.xyz">Open the live scanner</a> ·
  <a href="https://perp.chetra.xyz/methodology">Methodology</a> ·
  <a href="https://perp.chetra.xyz/funding-arbitrage">Funding guide</a> ·
  <a href="https://perp.chetra.xyz/faq">FAQ</a>
</p>

<p align="center">
  <a href="https://github.com/ychetra/perp-verdict"><img src="https://img.shields.io/badge/source-GitHub-16231f?style=flat-square&logo=github&logoColor=white" alt="Source on GitHub"></a>
  <a href="https://perp.chetra.xyz"><img src="https://img.shields.io/badge/status-read--only-2e7d4f?style=flat-square" alt="Read-only status"></a>
</p>

## Why it exists

Funding rates are easy to compare and easy to misunderstand. Perp Verdict puts a visible cost stack beside the headline differential:

```text
funding differential
− round-trip fees
− visible-book impact or depth reserve
− transfer-time reserve
− liquidation buffer
= modeled net per funding interval
```

The result is a review aid, not an instruction. `REVIEW` means that the model has not rejected the spread; it does not mean the spread is executable or profitable.

## What you can use

- Live public order-book streams from Binance USD-M Futures and Bybit linear perpetuals, plus a server-only, universe-allowlisted Binance `premiumIndex` quote poll. A feed is marked live only after a single active pair has both a validated quote and a visible order book.
- A server-selected universe of up to 25 active, common USDT perpetuals, ranked by the lower current 24h quote volume across Binance and Bybit. Instrument metadata, Binance funding-interval overrides, Bybit pagination, exact base assets, and matching cadence are required.
- A scatter map, live asset icons, accessible table, selected-pair evidence panel, and cost waterfall. Current universe assets use verified CoinGecko CDN icons; the image is cosmetic and falls back to a neutral token glyph if an allowlisted remote image fails.
- Shareable `/verdict/[pair]` Truth Cards with source timestamps and a fail-closed validation boundary.
- A compact, server-refreshed linked-headline brief from CoinDesk, Google Blog, and Cloudflare Blog. It shows only attributed titles, dates, and outbound URLs; it never changes a funding verdict.
- Readable explanations at [`/methodology`](https://perp.chetra.xyz/methodology), [`/funding-arbitrage`](https://perp.chetra.xyz/funding-arbitrage), and [`/faq`](https://perp.chetra.xyz/faq).
- Light mode by default, with a manually persisted dark mode and reduced-motion support.

## What it does not do

Perp Verdict does not place orders, connect exchange accounts, request withdrawals, sign transactions, store credentials, or claim that a modeled opportunity is a fill. It is not financial advice, a guarantee, a backtest, or a trading bot.

## Data states and honesty boundaries

The homepage has a clearly labeled four-pair seeded interactive fallback while the metadata universe or public streams connect. Seed values are not presented as live evidence. Once the validated universe is available, every additional pair waits for both venue quotes and both visible books; it cannot inherit a BTC, ETH, SOL, or XRP seed. The Binance quote poll accepts only the server-selected universe, rejects stale, future, malformed, and duplicate records, and clears its state on failure.

Shareable Truth Cards use server-only REST snapshots instead. They validate both venue responses, instrument metadata, source timestamps, funding cadence, ticker skew, freshness, and enough public depth for the configured notional. A failed check renders an unavailable card; it never substitutes seed data. Snapshots use a bounded process-local cache and are not a durable historical feed.

## Architecture

```text
app/page.tsx                         scanner entry and software metadata
components/funding-reality-check.tsx client map, ledger, theme, and public streams
lib/edge.ts                          fee-aware deterministic model
lib/sample-data.ts                   conservative interactive seed assumptions
lib/universe.ts                      server-only active-pair intersection and 24h-volume selection
lib/binance-quotes.ts                server-only allowlisted Binance quote validation
lib/server-snapshot.ts               source-stamped Truth Card validation
app/verdict/[pair]/                  shareable read-only evidence route
app/api/verdict/[pair]/              JSON Truth Card endpoint
app/api/universe/                    cached public Binance × Bybit pair universe
app/api/binance-quotes/              uncached validated Binance quote batch
app/methodology, funding-arbitrage,
app/faq                              static, indexable product education
```

There is no order-management, wallet, exchange-key, or execution layer in this repository.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/ychetra/perp-verdict.git
cd perp-verdict
npm install
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000). The public stream may be unavailable in some networks; the interface will identify its fallback state.

Before opening a pull request:

```bash
npm test
npm run lint
npm run build
```

## Contributing

Read [`docs/PRODUCT.md`](docs/PRODUCT.md), [`docs/DATA-CONTRACT.md`](docs/DATA-CONTRACT.md), and [`docs/DECISIONS.md`](docs/DECISIONS.md) first. Keep model inputs explicit, preserve venue/source labels, and add tests for every new cost or validation rule. Do not add execution paths, credentials, fake performance claims, or a news-driven verdict without a documented source and provenance boundary.

Small design improvements are welcome when they preserve keyboard access, light-first behavior, reduced motion, mobile ranking fallback, and the read-only contract.

## License and limits

This project is open source for inspection and collaboration. It is provided as-is for educational and research use. Market data can be delayed, incomplete, unavailable, or inconsistent between venues; always verify venue rules, fees, funding cadence, transfer constraints, margin requirements, and liquidation mechanics independently.

## Links

- Live app: <https://perp.chetra.xyz>
- Source: <https://github.com/ychetra/perp-verdict>
- Methodology: <https://perp.chetra.xyz/methodology>
- Funding arbitrage guide: <https://perp.chetra.xyz/funding-arbitrage>
- FAQ: <https://perp.chetra.xyz/faq>
