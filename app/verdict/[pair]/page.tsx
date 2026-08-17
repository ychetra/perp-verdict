import type { Metadata } from "next";
import Link from "next/link";
import { formatBps, formatCadenceHours, formatUsd } from "@/lib/edge";
import { SITE_URL } from "@/lib/site";
import { getCachedSnapshot } from "@/lib/server-snapshot";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 15;

function pairLabel(symbol: string) { return symbol.toUpperCase().replace("USDT", " / USDT"); }
function displayTime(value: string) { return value.replace("T", " ").replace(/\.\d{3}Z$/, " UTC").replace(/Z$/, " UTC"); }
function latestVenueTime(sources: { sourceTimestamp: string }[]) {
  const latest = sources.map((source) => Date.parse(source.sourceTimestamp)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  return latest ? displayTime(new Date(latest).toISOString()) : "Receipt time only";
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const symbol = pair.toUpperCase();
  const title = `${pairLabel(symbol)} live funding verdict | Perp Verdict`;
  const description = `${pairLabel(symbol)} server-validated public funding snapshot after fees and visible depth. Read-only, source-stamped, not executable.`;
  const url = `${SITE_URL}/verdict/${pair.toLowerCase()}`;
  return { title, description, robots: { index: false, follow: false }, alternates: { canonical: url }, openGraph: { type: "article", url, siteName: "Perp Verdict", title, description, images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630, alt: `${pairLabel(symbol)} live funding truth card` }] }, twitter: { card: "summary_large_image", title, description, images: [`${url}/opengraph-image`] } };
}

function UnavailableCard({ symbol, message }: { symbol: string; message: string }) {
  return <article className="verdict-article verdict-unavailable">
    <div className="verdict-kicker">LIVE FUNDING REALITY CHECK</div>
    <div className="verdict-title-row"><div><h1>{pairLabel(symbol)}</h1><p>Public source snapshot unavailable</p></div><span className="verdict-chip chip-stale">Unavailable</span></div>
    <div className="verdict-disclaimer"><strong>READ ONLY / NO FALLBACK</strong><span>This card will not substitute demo numbers when a source, cadence, timestamp, or book fails validation.</span></div>
    <section className="verdict-section"><div className="verdict-section-head"><h2>Why this card is unavailable</h2><span>FAIL CLOSED</span></div><p>{message}</p><p>Try the scanner again shortly. No exchange keys, orders, transfers, wallets, or execution are involved.</p></section>
  </article>;
}

export default async function VerdictPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const result = await getCachedSnapshot(pair);
  const symbol = result.symbol;
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: `${pairLabel(symbol)} live funding verdict`, description: "Source-stamped, read-only public market-data model.", url: `${SITE_URL}/verdict/${pair.toLowerCase()}`, isAccessibleForFree: true, author: { "@type": "Organization", name: "Perp Verdict" } };
  return <main className="verdict-shell">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="verdict-header"><Link className="verdict-back" href="/">← Back to scanner</Link><span className="verdict-brand">PERP VERDICT / TRUTH CARD</span></header>
    {result.kind === "unavailable" ? <UnavailableCard symbol={symbol} message={result.message} /> : <article className="verdict-article">
      <div className="verdict-kicker">LIVE FUNDING REALITY CHECK</div>
      <div className="verdict-title-row"><div><h1>{pairLabel(result.symbol)}</h1><p>Source-stamped public perpetual snapshot</p></div><span className={`verdict-chip chip-${result.model.status}`}>{result.model.status === "watch" ? "Review" : result.model.status === "stale" ? "Stale" : "Reject"}</span></div>
      <div className="verdict-disclaimer"><strong>MODELED / NOT EXECUTABLE</strong><span>Venue-reported ticker funding is not settled funding, and public order-book depth is not a fill. This is a read-only cost model.</span></div>
      <section className="verdict-summary" aria-labelledby="verdict-summary-heading"><div><span id="verdict-summary-heading">MODELED NET / FUNDING INTERVAL</span><strong className={result.model.modeledNetBps > 0 ? "signal-positive" : "signal-negative"}>{formatBps(result.model.modeledNetBps)}</strong><p>{result.model.direction}</p></div><div><span>RAW FUNDING DIFFERENTIAL</span><strong>{formatBps(result.model.grossFundingBps)}</strong><p>Venue-reported ticker rates; cadence checked comparable</p></div></section>
      <section className="verdict-section" aria-labelledby="route-heading"><div className="verdict-section-head"><h2 id="route-heading">Route and provenance</h2><span>LIVE SNAPSHOT</span></div><div className="verdict-route"><strong>{result.model.higherFundingVenue}</strong><span>short</span><b>→</b><strong>{result.model.higherFundingVenue === "Binance" ? "Bybit" : "Binance"}</strong><span>long</span></div><p>Observed cadence: Binance {formatCadenceHours(result.cadence.binanceHours)} · Bybit {formatCadenceHours(result.cadence.bybitHours)}. Source timestamps and endpoint hashes identify this response set.</p><div className="verdict-meta"><div><span>CAPTURED</span><strong>{displayTime(result.capturedAt)}</strong></div><div><span>BINANCE VENUE TIME</span><strong>{latestVenueTime(result.sources.binance)}</strong></div><div><span>BYBIT VENUE TIME</span><strong>{latestVenueTime(result.sources.bybit)}</strong></div><div><span>SNAPSHOT ID</span><strong className="verdict-hash">{result.snapshotId}</strong></div><div><span>NOTIONAL</span><strong>{formatUsd(result.model.notionalUsd)}</strong></div></div></section>
      <section className="verdict-section" aria-labelledby="source-heading"><div className="verdict-section-head"><h2 id="source-heading">Venue-reported ticker funding</h2><span>PUBLIC SOURCES</span></div><div className="verdict-meta"><div><span>BINANCE</span><strong>{(result.market.binance.currentQuotedFundingRate * 100).toFixed(5)}%</strong><small>{result.market.binance.fundingLabel} · {result.market.binance.fundingIntervalHours}h</small>{result.market.binance.lastSettledFundingRate !== undefined && <small>Last settled: {(result.market.binance.lastSettledFundingRate * 100).toFixed(5)}% at {displayTime(result.market.binance.lastSettledAt ?? "")}</small>}</div><div><span>BYBIT</span><strong>{(result.market.bybit.currentQuotedFundingRate * 100).toFixed(5)}%</strong><small>{result.market.bybit.fundingLabel} · {result.market.bybit.fundingIntervalHours}h</small></div></div><p className="verdict-source-label">Binance GET premiumIndex + depth + fundingRate history · Bybit GET linear tickers + level-50 orderbook</p></section>
      <section className="verdict-section" aria-labelledby="cost-heading"><div className="verdict-section-head"><h2 id="cost-heading">Cost stack</h2><span>PER FUNDING INTERVAL</span></div><dl className="verdict-costs"><div className="cost-yield"><dt>Funding differential</dt><dd>+{result.model.grossFundingBps.toFixed(2)} bp</dd></div><div><dt>Round-trip fees</dt><dd>−{result.model.roundTripFeeBps.toFixed(2)} bp</dd></div><div><dt>Visible-book impact</dt><dd>−{result.model.depthSlippageBps.toFixed(2)} bp</dd></div><div><dt>Transfer-time reserve</dt><dd>−{result.model.transferReserveBps.toFixed(2)} bp</dd></div><div><dt>Liquidation buffer</dt><dd>−{result.model.liquidationBufferBps.toFixed(2)} bp</dd></div><div className="cost-total"><dt>Modeled net</dt><dd>{formatBps(result.model.modeledNetBps)}</dd></div></dl></section>
      <p className="verdict-footer-note">Snapshot {result.snapshotId} is derived from public GET responses only. The route shown is explanatory, not an order instruction.</p>
    </article>}
    <footer className="verdict-footer"><span>PERP VERDICT / PUBLIC BETA</span><Link href="/">Open live scanner →</Link></footer>
  </main>;
}
