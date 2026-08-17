import type { Metadata } from "next";
import Link from "next/link";
import { SeoJsonLd, SeoLinks, SeoPage } from "@/components/seo-page";
import { SITE_URL } from "@/lib/site";

const title = "Perpetual Funding Arbitrage Guide | Perp Verdict";
const description = "A plain-language guide to perpetual funding arbitrage, hidden costs, visible depth, transfer risk, and why a headline rate is not a realized return.";
const url = `${SITE_URL}/funding-arbitrage`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { type: "website", url, siteName: "Perp Verdict", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perp Verdict perpetual funding arbitrage guide" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function FundingArbitragePage() {
  return <SeoPage active="funding-arbitrage" kicker="A PLAIN-LANGUAGE GUIDE" title={<>Perpetual funding<br /><em>arbitrage, without the fantasy.</em></>} intro="Funding arbitrage is often described as collecting the difference between venues. The useful question is narrower: what remains after the route's observable costs and unknowns are made explicit?">
    <SeoJsonLd title={title} description={description} url={url} pageName="Funding arbitrage guide" />
    <section className="seo-section" aria-labelledby="guide-definition">
      <p className="seo-section-label">01 / The idea</p>
      <h2 id="guide-definition">What perpetual funding arbitrage means.</h2>
      <p>Perpetual contracts use periodic funding transfers to keep their market price near an underlying reference. When two venues report different funding rates, a market participant may describe the gap as an arbitrage opportunity: one side of a route receives funding while the other side pays it.</p>
      <p>That description is incomplete. The rates may use different intervals, fees reduce the spread, order-book depth changes the executable price, and transferring collateral can take time. The difference is an observation—not a guaranteed outcome.</p>
    </section>
    <section className="seo-section" aria-labelledby="guide-costs">
      <p className="seo-section-label">02 / The missing costs</p>
      <h2 id="guide-costs">A headline rate is not a return.</h2>
      <div className="seo-table-wrap"><table className="seo-table"><caption>Costs Perp Verdict keeps visible in its model</caption><thead><tr><th scope="col">Model input</th><th scope="col">Why it matters</th></tr></thead><tbody>
        <tr><th scope="row">Funding cadence</th><td>A rate quoted for one interval cannot be compared blindly with a different interval.</td></tr>
        <tr><th scope="row">Round-trip fees</th><td>Opening and closing both legs consumes part of the observed differential.</td></tr>
        <tr><th scope="row">Visible depth</th><td>The top quote is not the same as the average price across a notional size.</td></tr>
        <tr><th scope="row">Transfer-time reserve</th><td>Collateral movement and operational delays introduce exposure that a rate alone cannot show.</td></tr>
        <tr><th scope="row">Liquidation buffer</th><td>Leverage, margin rules, and price movement can dominate a small funding difference.</td></tr>
      </tbody></table></div>
    </section>
    <section className="seo-section seo-split" aria-labelledby="guide-use">
      <div><p className="seo-section-label">03 / How to use it</p><h2 id="guide-use">Use the scanner as a skeptical first pass.</h2></div>
      <div className="seo-copy-stack"><p>Start with the <Link className="seo-inline-link" href="/">live scanner</Link> and select a market to inspect the source-stamped snapshot. Read the cost stack before looking at the raw funding differential.</p><p>Check the captured time, venue timestamps, cadence labels, and source paths. If the card is unavailable or stale, treat that as missing evidence—not as an invitation to fill in the gaps.</p><p>For the calculation boundaries and validation rules, see the <Link className="seo-inline-link" href="/methodology">methodology</Link>.</p></div>
    </section>
    <section className="seo-section seo-boundary" aria-labelledby="guide-risk">
      <p className="seo-section-label">04 / Keep the boundary</p>
      <h2 id="guide-risk">This is market-data education.</h2>
      <p>Perp Verdict is not a broker, exchange, adviser, or execution service. It does not account for every fee, margin rule, funding change, withdrawal restriction, tax treatment, or market event. Nothing on this page is financial advice or a promise of profit.</p>
    </section>
    <SeoLinks current="funding-arbitrage" />
  </SeoPage>;
}
