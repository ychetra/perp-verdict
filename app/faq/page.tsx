import type { Metadata } from "next";
import Link from "next/link";
import { SeoJsonLd, SeoLinks, SeoPage } from "@/components/seo-page";
import { SITE_URL } from "@/lib/site";

const title = "Perp Verdict FAQ | Funding Arbitrage Scanner";
const description = "Answers about Perp Verdict's read-only funding scanner, public sources, modeled costs, freshness, and why results are not executable instructions.";
const url = `${SITE_URL}/faq`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { type: "website", url, siteName: "Perp Verdict", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perp Verdict frequently asked questions" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

const questions = [
  ["What is Perp Verdict?", "It is a public, read-only scanner for perpetual funding differentials. It models fees, visible order-book depth, transfer-time reserve, and liquidation buffer so a headline funding rate is not shown in isolation."],
  ["Does Perp Verdict place trades?", "No. The app does not accept exchange keys, connect accounts, move funds, place orders, or provide an execution path. Cards are modeled evidence, not instructions."],
  ["Where does the data come from?", "The live scanner reads public Binance and Bybit market streams. Shareable Truth Cards use server-side public GET responses and label source paths, receipt times, venue timestamps, and response hashes when a snapshot is available."],
  ["Why can a result be unavailable?", "A shareable Truth Card fails closed when a source, timestamp, funding cadence, or visible-depth check cannot be validated. The interactive homepage may instead retain clearly labeled conservative seed inputs while a venue stream is unavailable; those seeds are never used for a server Truth Card."],
  ["Is a positive modeled net guaranteed?", "No. A modeled net is an estimate based on a public snapshot and explicit assumptions. Rates, fees, liquidity, margin conditions, transfer timing, and market prices can change. There is no promise of profit."],
  ["What should I read first?", "Start with the funding arbitrage guide for context, then read the methodology for the cost stack and validation rules before opening the live scanner."],
];

export default function FaqPage() {
  return <SeoPage active="faq" kicker="QUESTIONS, WITHOUT THE SALES PITCH" title={<>Perp Verdict<br /><em>FAQ.</em></>} intro="The short answers cover what the scanner measures, what its public data means, and the boundary between a modeled observation and an executable action.">
    <SeoJsonLd title={title} description={description} url={url} pageName="FAQ" />
    <section className="seo-section" aria-labelledby="faq-heading">
      <p className="seo-section-label">Frequently asked questions</p>
      <h2 id="faq-heading">Read the assumptions before reading the number.</h2>
      <div className="seo-faq-list">{questions.map(([question, answer]) => <article className="seo-faq-item" key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div>
    </section>
    <section className="seo-section seo-boundary" aria-labelledby="faq-start">
      <p className="seo-section-label">Ready to inspect a snapshot?</p>
      <h2 id="faq-start">Start with the evidence, not the headline.</h2>
      <p>Open the scanner to inspect the current public snapshot. For how each modeled line is calculated, visit the <Link className="seo-inline-link" href="/methodology">methodology</Link>.</p>
    </section>
    <SeoLinks current="faq" />
  </SeoPage>;
}
