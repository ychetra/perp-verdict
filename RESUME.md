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

## 2026-08-17 scanner homepage clarity release

- Published a real homepage navigation linking directly to the scanner, methodology, funding guide, and FAQ while preserving the feed state and light-first theme control.
- Replaced the oversized marketing-style hero and its redundant aside with a compact evidence briefing; the live opportunity map now reaches the first viewport sooner. The market rail uses quieter sentence-case labels and fewer visual dividers.
- No data or execution behavior changed: public WebSockets, pair/filter selection, share cards, theme persistence, reduced-motion behavior, and mobile fallback all remain intact.
- Verified locally and on `https://perp.chetra.xyz`: 13 tests, lint, production build, clean diff, and rendered navbar/title checks passed. Source commit: `9416616`.

## 2026-08-17 visual identity and sourced-brief release

- Published `e4618be` with a first-party Perp Verdict SVG mark, a self-hosted site icon, and decorative BTC, ETH, SOL, and XRP asset marks in the interactive map and mobile ranking. Asset symbols remain available in the parent button labels for assistive technology.
- Refreshed `README.md` with the current public source and production URLs, accurate read-only/data-state boundaries, local validation commands, and the visual brand asset.
- Added the compact `EXTERNAL CONTEXT` brief below the ledger. It fetches only article title, HTTPS URL, publication date, and fixed source label from CoinDesk, Google Blog, and Cloudflare Blog; it renders attribution and outbound links only. It is explicitly excluded from the funding verdict and never provides summaries, sentiment, price claims, or trade calls.
- The `/api/briefs` endpoint revalidates every 15 minutes, limits feed calls to 5 seconds, tolerates individual source failure, returns a transparent unavailable state only when all feeds fail, and accepts only exact authorized HTTPS hosts with no credentials or custom port. It has no persistence or execution capability.
- Independent checks: 15 tests, lint, production build, clean diff, public icon HTTP 200, updated homepage markup, and the production API returned live attributed CoinDesk/Cloudflare headlines. Google Blog RSS is also a configured and hostname-validated source; it will appear when its eligible items rank within the three current AI/infrastructure links.

## 2026-08-17 shared navigation release

- Published `d2af6d3`, which consolidates the homepage and all three SEO pages behind the single `components/site-nav.tsx` navigation component. It uses the same four essential destinations everywhere: Scanner, Methodology, Funding guide, and FAQ.
- The homepage retains live venue state and the light/dark control; documentation pages retain the same visual/navigation frame without dead in-page Scanner anchors. Old duplicated navigation markup and CSS were removed.
- Verified locally with 15 tests, lint, production build, and clean diff, then publicly on all four routes. The documentation Scanner link resolves to `/#scanner`.

## 2026-08-17 multipair coverage release

- Published `c6c99e7`, expanding homepage coverage from the four seed pairs to a dynamically selected maximum of 25 liquid Binance USD-M × Bybit linear USDT perpetual intersections. Selection requires active instrument metadata, exact normalized base/symbol agreement, matching funding cadence, Binance funding-interval overrides, paginated Bybit metadata, and strictly positive 24h volume on both venues. Ranking uses the lower of the two venue volumes.
- The universe route is public/read-only, cached for 15 minutes, noindexed, and executes in Singapore through the existing project-wide Vercel `sin1` configuration. Missing sources, mismatched cadence, stale/missing quotes or books, insufficient visible depth, and unsupported pairs remain visibly unavailable. New pairs never inherit seed values.
- The four prior seeds remain an explicitly labelled interactive fallback while the universe is unavailable/connecting. Unknown asset symbols render a neutral generic mark instead of an incorrect BTC mark. Theme controls remain functional in loading/unavailable states.
- Independent proof: 20 tests, lint, production build, clean diff, and local plus public `/api/universe` checks returned `kind: available`, 25 validated pairs, BTCUSDT first, an 8h cadence, 15-minute cache headers, and `X-Robots-Tag: noindex, nofollow`.
- Additional venue research was deliberately not shipped: current OKX and Bitget API terms make public redistribution/display of their market data legally uncertain. Obtain written permission before enabling either venue; do not infer consent from a working public endpoint.

## 2026-08-17 multipair live-quote recovery

- The initial 25-pair browser scanner could show an empty fail-closed state even while its badge said both feeds were live. The cause was a silent Binance `@markPrice` WebSocket: it opened and Binance depth plus both Bybit streams arrived, but it emitted no mark/funding quote messages. The badge previously used socket-open state rather than evidence arrival.
- Replaced only the silent Binance quote stream with `/api/binance-quotes`, a server-only read-only route using Binance's batch `premiumIndex` source. It filters exclusively to the cached server-selected universe, rejects stale, future, malformed, duplicate, or unallowlisted records, times out after five seconds, is uncached/noindexed, and returns unavailable rather than any seed fallback. The client polls it every four seconds and clears its quote state on failure; Binance depth and Bybit ticker/order-book data remain public WebSockets.
- Feed state now requires quote plus visible book for the same active symbol at each venue, so it cannot claim a live feed solely because a socket connected. The scanner's existing full-row freshness/depth gate remains unchanged.
- Independent proof before publish: 24 tests, lint, production build, clean diff, local route returned 25 validated Binance quotes, and a 12-second public-protocol probe observed Binance quote/depth plus Bybit ticker/book for all 25 active pairs. No order, key, transfer, account, or seed-data path was added.

## Next milestone

Publish and verify the multipair live-quote recovery on `perp.chetra.xyz`, then observe reconnect/load behavior under normal use before expanding coverage. Wait 24–48 hours for Google Search Console to reprocess the newly submitted sitemap and discover the four stable URLs. If it remains unreadable, inspect the actual Googlebot event in Cloudflare Security Events before considering a narrowly scoped exception. Obtain written public-display permission before adding any further venue. A durable historical card store remains out of scope until retention, privacy, and provenance policy are designed.
