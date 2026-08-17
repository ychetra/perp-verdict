# Perp Verdict maintainer handoff

Updated: 2026-08-17

- Public source: `https://github.com/ychetra/perp-verdict`
- Live production: `https://perp-verdict.vercel.app`
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

## Next milestone

Audit and publish this dynamic snapshot milestone, then attach a custom domain and verify it in Google Search Console. A durable historical card store remains out of scope until retention, privacy, and provenance policy are designed.
