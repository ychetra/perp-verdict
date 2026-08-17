"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

type Theme = "dark" | "light";
type Connection = "connecting" | "live" | "partial" | "fallback";
type Active = "scanner" | "methodology" | "funding-arbitrage" | "faq";

const links: Array<{ href: string; label: string; active: Active }> = [
  { href: "/#scanner", label: "Scanner", active: "scanner" },
  { href: "/methodology", label: "Methodology", active: "methodology" },
  { href: "/funding-arbitrage", label: "Funding guide", active: "funding-arbitrage" },
  { href: "/faq", label: "FAQ", active: "faq" },
];

function ThemeIcon({ theme }: { theme: Theme }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {theme === "dark" ? <><circle cx="12" cy="12" r="3.25" /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28 17.3 6.7M6.7 17.3l-1.42 1.42M18.72 18.72 17.3 17.3M6.7 6.7 5.28 5.28" /></> : <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />}
  </svg>;
}

export function SiteNav({ active, connection, theme, onToggleTheme }: { active: Active; connection?: Connection; theme?: Theme; onToggleTheme?: () => void }) {
  const feedText = connection === "live" ? "Both venue feeds live" : connection === "partial" ? "One venue feed live" : connection === "fallback" ? "Waiting for public feeds" : "Connecting public feeds";
  return <header className="site-nav">
    <Link className="site-wordmark" href="/#scanner" aria-label="Perp Verdict scanner"><BrandMark /><span>Perp Verdict</span></Link>
    <nav className="site-links" aria-label="Perp Verdict navigation">
      {links.map((link) => <Link key={link.href} className={link.active === active ? "site-link-active" : undefined} href={link.href} aria-current={link.active === active ? "page" : undefined}>{link.label}</Link>)}
    </nav>
    {(connection || (theme && onToggleTheme)) && <div className="site-actions">
      {connection && <span className={`feed-state feed-${connection}`}><i />{feedText}</span>}
      {theme && onToggleTheme && <button className="theme-button" onClick={onToggleTheme} aria-label="Toggle dark and light mode"><ThemeIcon theme={theme} /><span>{theme === "dark" ? "Light" : "Dark"}</span></button>}
    </div>}
  </header>;
}
