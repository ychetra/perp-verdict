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
- Cloudflare's current served `robots.txt` permits indexing, disallows only `/api/` and `/verdict/`, and references the production sitemap. It has no special GPTBot, ClaudeBot, or Google-Extended disallow directives.

## 2026-08-17 Google Search Console verification

- The URL-prefix property for `https://perp.chetra.xyz/` is active. Google Search Console's homepage Live Test reported `URL is available to Google` and `Page can be indexed`.
- The sitemap was re-submitted successfully. At the time of submission, Search Console retained `Sitemap could not be read` from its prior fetch, but independent public checks returned HTTP 200, `application/xml`, a valid 213-byte sitemap, the expected HTTPS redirect behavior, and the same response to a Googlebot-identifying user agent. `robots.txt` is HTTP 200 and references the exact sitemap URL.
- Treat the current sitemap error as pending Google reprocessing for 24–48 hours; do not request indexing for the sitemap. If it remains after that window, first inspect Cloudflare Security Events for a verified Googlebot request to `/sitemap.xml` before creating any narrowly scoped bot/WAF skip rule.

## 2026-08-17 Cloudflare sitemap audit

- A live Cloudflare API audit confirmed the `chetra.xyz` zone is active and proxied. Bot Fight Mode and all AI bot protection modes are disabled; the zone has no custom firewall rules and no IP access rules. Managed WAF and L7 DDoS rules remain active. Browser Integrity Check is enabled at the zone level.
- Cloudflare does not currently manage the served `robots.txt`; Vercel's application route remains authoritative. Normal and Googlebot-identifying public requests both received HTTP 200 and valid XML from `/sitemap.xml`.
- Cloudflare HTTP request analytics for `/sitemap.xml` also showed HTTP 200 response groups for `Googlebot` and `Google-InspectionTool` user agents. The observed 401/403/530 groups were associated with non-Google browser or Claude bot user agents. User-agent labels are not proof of Google IP ownership, but this does not implicate Cloudflare in the Search Console error.
- No Cloudflare bypass or security change was created: there is no evidence that Cloudflare is blocking Googlebot, and bypassing Browser Integrity Check would weaken protection without an identified cause.

## 2026-08-17 static SEO page release

- Published three static, indexable education pages: `/methodology`, `/funding-arbitrage`, and `/faq`. Each has a unique title/description, self-canonical under `https://perp.chetra.xyz`, Open Graph/Twitter metadata, and truthful `WebPage` plus `BreadcrumbList` JSON-LD. The FAQ deliberately does not use `QAPage` markup.
- Added the three stable canonical URLs to `sitemap.xml` alongside the home page, and added descriptive homepage and cross-page internal links.
- The pages preserve the light-first/dark-compatible visual system and read-only boundary. They explicitly distinguish the interactive homepage's clearly labeled seed fallback from server Truth Cards, which continue to fail closed and never use seeds.
- Verified locally and in production: 13 tests passed, lint passed, production build passed with all three pages static, public rendered titles/canonicals/JSON-LD matched the intended URLs, and the sitemap served HTTP 200 `application/xml` with all four stable URLs.

## Next milestone

Wait 24–48 hours for Google Search Console to reprocess the newly submitted sitemap and discover the four stable URLs. If it remains unreadable, inspect the actual Googlebot event in Cloudflare Security Events before considering a narrowly scoped exception. After discovery, publish one source-grounded comparison or methodology extension only when it adds real user value; a durable historical card store remains out of scope until retention, privacy, and provenance policy are designed.
