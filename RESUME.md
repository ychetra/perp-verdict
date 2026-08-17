# Perp Verdict maintainer handoff

Updated: 2026-08-17

- Public source: `https://github.com/ychetra/perp-verdict`
- Live production: `https://perp-verdict.vercel.app`
- Hosting: Vercel project `perp-verdict`; the first CLI deployment was promoted to production by Vercel.
- Verified baseline: local tests, lint, production build, Vercel deployment status, HTTPS 200, and live title/description/JSON-LD.
- Local-only `.env.local` and `.vercel/` are ignored. Never commit either.

## 2026-08-17 share-card release

- Theme behavior is deliberately light-first. A user can manually switch to dark mode; that choice is persisted locally and restored before paint.
- Public, static Truth Cards now live at `/verdict/btcusdt`, `/verdict/ethusdt`, `/verdict/solusdt`, and `/verdict/xrpusdt`, with canonical URLs and 1200×630 Open Graph images.
- The cards use a fixed demo fixture snapshot (`2026-01-01T00:00:00.000Z`), visibly labeled **MODELED / NOT EXECUTABLE**. Do not describe them as live market evidence.
- Root and card routes include canonical, Open Graph, and Twitter metadata. `robots.txt` and `sitemap.xml` cover only stable routes.
- Release checks passed: 5 unit tests, lint, production build, page/metadata/PNG smoke checks, visual QA in both themes, and public production verification (card 200, OG PNG 1200×630, sitemap/robots 200, invalid card 404).
- Vercel preview deployments are account-login protected. Run public sharing checks against the production alias rather than preview URLs.

## Next milestone

Replace the fixed demo fixture with source-stamped Binance/Bybit snapshots before presenting Truth Cards as current market evidence. Then attach a custom domain and verify it in Google Search Console.
