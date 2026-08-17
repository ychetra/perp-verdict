import Link from "next/link";
import type { ReactNode } from "react";

type SeoPageKey = "methodology" | "funding-arbitrage" | "faq";

const links: Array<{ href: string; label: string; key?: SeoPageKey }> = [
  { href: "/", label: "Live scanner" },
  { href: "/methodology", label: "Methodology", key: "methodology" },
  { href: "/funding-arbitrage", label: "Funding guide", key: "funding-arbitrage" },
  { href: "/faq", label: "FAQ", key: "faq" },
];

export function SeoJsonLd({
  title,
  description,
  url,
  pageName,
}: {
  title: string;
  description: string;
  url: string;
  pageName: string;
}) {
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      isAccessibleForFree: true,
      inLanguage: "en",
      publisher: { "@type": "Organization", name: "Perp Verdict", url: "https://perp.chetra.xyz" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Perp Verdict", item: "https://perp.chetra.xyz/" },
        { "@type": "ListItem", position: 2, name: pageName, item: url },
      ],
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }} />;
}

export function SeoPage({
  active,
  kicker,
  title,
  intro,
  children,
}: {
  active: SeoPageKey;
  kicker: string;
  title: ReactNode;
  intro: string;
  children: ReactNode;
}) {
  return <main className="seo-shell">
    <header className="seo-header">
      <Link className="seo-wordmark" href="/" aria-label="Perp Verdict home"><span className="wordmark-sigil">PV</span><span>Perp Verdict</span></Link>
      <nav className="seo-nav" aria-label="Guide navigation">
        {links.map((link) => <Link key={link.href} className={link.key === active ? "seo-nav-active" : undefined} href={link.href} aria-current={link.key === active ? "page" : undefined}>{link.label}</Link>)}
      </nav>
    </header>
    <article>
      <div className="seo-hero">
        <div>
          <p className="seo-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="seo-intro">{intro}</p>
        </div>
        <aside className="seo-hero-note" aria-label="Perp Verdict principles">
          <span>PERP VERDICT / PUBLIC BETA</span>
          <strong>Modeled, not executable.</strong>
          <p>Public market data is translated into a cost-aware estimate. It is not an order, recommendation, or promise.</p>
        </aside>
      </div>
      <div className="seo-content">{children}</div>
    </article>
    <footer className="seo-footer"><span>READ-ONLY MARKET DATA / NO KEYS / NO ORDERS</span><Link href="/">Open the live scanner →</Link></footer>
  </main>;
}

export function SeoLinks({ current }: { current: SeoPageKey }) {
  const otherLinks = links.filter((link) => link.key && link.key !== current);
  return <aside className="seo-next" aria-label="Continue reading">
    <span className="seo-section-label">Continue reading</span>
    <div>{otherLinks.map((link) => <Link key={link.href} href={link.href}>{link.label} <span aria-hidden="true">→</span></Link>)}</div>
  </aside>;
}
