import type { Metadata } from "next";
import Link from "next/link";
import { SeoJsonLd, SeoLinks, SeoPage } from "@/components/seo-page";
import { SITE_URL } from "@/lib/site";

const title = "Funding Arbitrage Methodology | Perp Verdict";
const description = "How Perp Verdict models perpetual funding differentials after fees, visible order-book depth, transfer time, and liquidation buffer.";
const url = `${SITE_URL}/methodology`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { type: "website", url, siteName: "Perp Verdict", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perp Verdict funding methodology" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function MethodologyPage() {
  return <SeoPage active="methodology" kicker="HOW THE CHECK WORKS" title={<>How Perp Verdict<br />calculates <em>funding arbitrage.</em></>} intro="Perp Verdict turns a public funding differential into a transparent cost model. Every result is a read-only estimate with its assumptions and freshness state visible.">
    <SeoJsonLd title={title} description={description} url={url} pageName="Methodology" />
    <section className="seo-section" aria-labelledby="method-measures">
      <p className="seo-section-label">01 / What is measured</p>
      <h2 id="method-measures">A funding spread can disappear in the cost stack.</h2>
      <p>The scanner compares public perpetual-market funding data across supported venues, then subtracts modeled costs that a headline rate leaves out. It is designed to expose uncertainty, not to manufacture a trade.</p>
      <div className="seo-equation"><span>MODELED NET / FUNDING INTERVAL</span><code>funding differential − fees − depth impact − transfer reserve − liquidation buffer</code></div>
    </section>
    <section className="seo-section seo-steps" aria-labelledby="method-steps">
      <p className="seo-section-label">02 / The sequence</p>
      <h2 id="method-steps">Five checks before a verdict appears.</h2>
      <ol>
        <li><strong>Normalize the funding interval.</strong><span>Rates are compared only when the venue-reported cadence is comparable.</span></li>
        <li><strong>Subtract round-trip fees.</strong><span>Both sides of the modeled route receive an explicit fee allowance.</span></li>
        <li><strong>Estimate visible-book impact.</strong><span>Available public order-book levels are used as a depth constraint, not as proof of a fill.</span></li>
        <li><strong>Reserve for transfer time.</strong><span>A cross-venue route has time and operational uncertainty, so the model keeps a configurable reserve.</span></li>
        <li><strong>Hold a liquidation buffer.</strong><span>Leverage and liquidation risk are not reduced to a funding percentage.</span></li>
      </ol>
    </section>
    <section className="seo-section seo-split" aria-labelledby="method-status">
      <div><p className="seo-section-label">03 / Reading the result</p><h2 id="method-status">Statuses are guardrails, not signals.</h2></div>
      <div className="seo-copy-stack"><p><strong>Review</strong> means the current modeled net survives the configured checks, but it still depends on public snapshots and assumptions.</p><p><strong>Reject</strong> means modeled costs consume the observed differential or validation fails.</p><p><strong>Unavailable</strong> on a shareable Truth Card means its server snapshot failed closed because a source, timestamp, cadence, or depth check was not trustworthy.</p><p>The interactive homepage may retain clearly labeled conservative seed inputs while a venue stream is unavailable; those seeds are never substituted into a server Truth Card.</p></div>
    </section>
    <section className="seo-section seo-boundary" aria-labelledby="method-boundary">
      <p className="seo-section-label">04 / Hard boundary</p>
      <h2 id="method-boundary">What Perp Verdict does not do.</h2>
      <p>It does not connect exchange accounts, accept API keys, place orders, move funds, predict prices, or guarantee a return. A public snapshot is not a fill, and a modeled result can change before a human could act.</p>
      <p><Link className="seo-inline-link" href="/">Open the live read-only scanner →</Link></p>
    </section>
    <SeoLinks current="methodology" />
  </SeoPage>;
}
