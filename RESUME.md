# Perp Verdict maintainer handoff

Updated: 2026-08-17

- Public source: `https://github.com/ychetra/perp-verdict`
- Live production: `https://perp.chetra.xyz` (primary); the Vercel URL remains available but declares this custom canonical.
- Hosting: Vercel project `perp-verdict`; the first CLI deployment was promoted to production by Vercel.
- Verified baseline: local tests, lint, production build, Vercel deployment status, HTTPS 200, and live title/description/JSON-LD.
- Local-only `.env.local` and `.vercel/` are ignored. Never commit either.

## 2026-08-17 share-card release

- Theme behavior is deliberately light-first. A user can manually switch to dark mode; that choice is persisted locally and restored before paint.
- Public Truth Card routes now call a server-only, read-only Binance/Bybit REST snapshot through a bounded process-local 15-second cache. It is not durable, globally shared, or a historical feed. They validate source envelopes, timestamps, observed funding cadence, and depth before modeling.
- Cards expose source labels/paths, per-response receipt times, venue timestamps (or receipt-only fallback), endpoint payload hashes, and a combined SHA-256 snapshot ID. Venue-reported ticker funding is labeled separately from Binance's latest settled funding history and timestamp. Instrument metadata, 15-second live-source freshness, and <=15-second ticker skew are required before modeling.
- Failed source, cadence, time, or depth validation renders an unavailable card/image; there is no seed-data fallback, persistence, key, order, transfer, or execution path.
- Root and card routes include canonical, Open Graph, and Twitter metadata. `robots.txt` and `sitemap.xml` cover only stable routes.
- Release checks passed previously: 5 fixture-era tests, lint, production build, page/metadata/PNG smoke checks, visual QA in both themes, and public production verification. New deterministic snapshot tests cover good data, cadence mismatch, malformed/HTTP response, insufficient depth, and seed isolation.
- Vercel preview deployments are account-login protected. Run public sharing checks against the production alias rather than preview URLs.

## 2026-08-17 dynamic snapshot production release

- Published the source-stamped Truth Card implementation (50683f1) and its Singapore regional compatibility fix (00ff042) to the public main branch.
- Verified the public production alias end-to-end: the API returned a validated Binance/Bybit BTCUSDT snapshot with four Binance and three Bybit provenance records, comparable 8h cadence, a SHA-256 snapshot ID, and a 15-second cache reuse. The page and 1200x630 Open Graph image rendered the modeled/not-executable evidence correctly.
- Vercel Functions execute in sin1. The default iad1 execution region returned Binance HTTP 451; sin1 returned validated public source data. This is an upstream compatibility setting, never a proxy or fallback, and every source failure remains explicitly unavailable.

## 2026-08-17 custom-domain release

- Attached and verified `perp.chetra.xyz` for the Vercel project through Cloudflare. HTTPS serves production, and HTTP permanently redirects to HTTPS.
- Commit 20dc632 changes the canonical site base, Open Graph URLs, schema URLs, sitemap, and robots sitemap reference to `https://perp.chetra.xyz`. The legacy Vercel hostname now advertises the same custom canonical.
- Cloudflare Managed robots currently permits search indexing but disallows several AI crawler user agents, including GPTBot, ClaudeBot, and Google-Extended. That is a Cloudflare policy decision, not an app rule; decide deliberately whether to allow those agents before treating GEO as complete.

## Next milestone

Verify `https://perp.chetra.xyz` in Google Search Console and decide the Cloudflare Managed robots policy for AI crawlers. A durable historical card store remains out of scope until retention, privacy, and provenance policy are designed.
