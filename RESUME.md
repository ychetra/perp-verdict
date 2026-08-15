# Perp Verdict maintainer handoff

Updated: 2026-08-15

- Public source: `https://github.com/ychetra/perp-verdict`
- Live production: `https://perp-verdict.vercel.app`
- Hosting: Vercel project `perp-verdict`; the first CLI deployment was promoted to production by Vercel.
- Verified: local tests, lint, production build, Vercel deployment status, HTTPS 200, and live title/description/JSON-LD.
- Local-only `.env.local` and `.vercel/` are ignored. Never commit either.

## Next milestone

Add stable canonical and Open Graph metadata plus a timestamped, shareable verdict page that keeps the public scanner's modeled-not-executable disclaimer visible.
