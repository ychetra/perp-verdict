import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBps, formatUsd } from "@/lib/edge";
import { SITE_URL, verdictUrl } from "@/lib/site";
import { getVerdict, getVerdictFreshness, getVerdictTimestamp, VERDICT_CONTEXT, VERDICT_DISCLAIMER, VERDICT_SYMBOLS } from "@/lib/verdict-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return VERDICT_SYMBOLS.map((symbol) => ({ pair: symbol.toLowerCase() }));
}

function pairLabel(symbol: string) {
  return symbol.replace("USDT", " / USDT");
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const verdict = getVerdict(pair);
  if (!verdict) notFound();
  const title = `${pairLabel(verdict.symbol)} funding verdict | Perp Verdict`;
  const description = `${pairLabel(verdict.symbol)} modeled funding differential after fees, depth, transfer-time reserve, and liquidation buffer. Read-only, not executable.`;
  const url = verdictUrl(verdict.symbol);
  const image = `${url}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Perp Verdict",
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${pairLabel(verdict.symbol)} modeled funding truth card` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function VerdictPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const verdict = getVerdict(pair);
  if (!verdict) notFound();
  const timestamp = getVerdictTimestamp(verdict);
  const shortPair = pairLabel(verdict.symbol);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${shortPair} funding verdict`,
    description: VERDICT_DISCLAIMER,
    url: `${SITE_URL}/verdict/${pair.toLowerCase()}`,
    dateModified: timestamp.toISOString(),
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: "Perp Verdict" },
  };

  return <main className="verdict-shell">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="verdict-header">
      <Link className="verdict-back" href="/">← Back to scanner</Link>
      <span className="verdict-brand">PERP VERDICT / TRUTH CARD</span>
    </header>
    <article className="verdict-article">
      <div className="verdict-kicker">MODELED FUNDING REALITY CHECK</div>
      <div className="verdict-title-row"><div><h1>{shortPair}</h1><p>Cross-exchange perpetual funding snapshot</p></div><span className={`verdict-chip chip-${verdict.status}`}>{verdict.status === "watch" ? "Review" : verdict.status === "stale" ? "Stale" : "Reject"}</span></div>
      <div className="verdict-disclaimer"><strong>MODELED / NOT EXECUTABLE</strong><span>{VERDICT_DISCLAIMER.replace("MODELED / NOT EXECUTABLE. ", "")}</span></div>
      <section className="verdict-summary" aria-labelledby="verdict-summary-heading">
        <div><span id="verdict-summary-heading">MODELED NET / FUNDING INTERVAL</span><strong className={verdict.modeledNetBps > 0 ? "signal-positive" : "signal-negative"}>{formatBps(verdict.modeledNetBps)}</strong><p>{verdict.direction}</p></div>
        <div><span>RAW FUNDING DIFFERENTIAL</span><strong>{formatBps(verdict.grossFundingBps)}</strong><p>{verdict.higherFundingVenue} has the higher modeled rate</p></div>
      </section>
      <section className="verdict-section" aria-labelledby="route-heading"><div className="verdict-section-head"><h2 id="route-heading">Route and context</h2><span>STATIC MODEL</span></div><div className="verdict-route"><strong>{verdict.higherFundingVenue}</strong><span>short</span><b>→</b><strong>{verdict.higherFundingVenue === "Binance" ? "Bybit" : "Binance"}</strong><span>long</span></div><p>{VERDICT_CONTEXT}</p><div className="verdict-meta"><div><span>MODEL TIMESTAMP</span><strong>{timestamp.toISOString().replace("T", " ").replace(".000Z", " UTC")}</strong></div><div><span>FRESHNESS</span><strong>{getVerdictFreshness(verdict)}</strong></div><div><span>NOTIONAL</span><strong>{formatUsd(verdict.notionalUsd)}</strong></div></div></section>
      <section className="verdict-section" aria-labelledby="cost-heading"><div className="verdict-section-head"><h2 id="cost-heading">Cost stack</h2><span>PER FUNDING INTERVAL</span></div><dl className="verdict-costs"><div className="cost-yield"><dt>Funding differential</dt><dd>+{verdict.grossFundingBps.toFixed(2)} bp</dd></div><div><dt>Round-trip fees</dt><dd>−{verdict.roundTripFeeBps.toFixed(2)} bp</dd></div><div><dt>Depth impact reserve</dt><dd>−{verdict.depthSlippageBps.toFixed(2)} bp</dd></div><div><dt>Transfer-time reserve</dt><dd>−{verdict.transferReserveBps.toFixed(2)} bp</dd></div><div><dt>Liquidation buffer</dt><dd>−{verdict.liquidationBufferBps.toFixed(2)} bp</dd></div><div className="cost-total"><dt>Modeled net</dt><dd>{formatBps(verdict.modeledNetBps)}</dd></div></dl></section>
      <p className="verdict-footer-note">This Truth Card preserves the modeled inputs used by the public demo. It does not stream books, place orders, move funds, use exchange keys, or establish that a fill occurred.</p>
    </article>
    <footer className="verdict-footer"><span>PERP VERDICT / PUBLIC BETA</span><Link href="/">Open live scanner →</Link></footer>
  </main>;
}
