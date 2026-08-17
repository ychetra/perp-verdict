"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { calculateOpportunity, formatBps, formatUsd } from "@/lib/edge";
import { seedInputs } from "@/lib/sample-data";
import { verdictUrl } from "@/lib/site";
import type { FundingLeg, Opportunity, Venue } from "@/lib/types";
import { AssetMark } from "@/components/asset-mark";
import { BrandMark } from "@/components/brand-mark";
import { NewsBriefs } from "@/components/news-briefs";
import { SiteNav } from "@/components/site-nav";

type Theme = "dark" | "light";
const THEME_CHANGE_EVENT = "perp-verdict-theme-change";
type Filter = "all" | Opportunity["status"];
type ConnectionState = "connecting" | "live" | "partial" | "fallback";
type Book = { bids: [number, number][]; asks: [number, number][] };
type LiveQuotes = Record<string, Partial<Record<Venue, Partial<FundingLeg>>>>;
type LiveBooks = Record<string, Partial<Record<Venue, Book>>>;

const symbols = seedInputs.map(({ symbol }) => symbol);
const emptyBook: Book = { bids: [], asks: [] };

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function levels(raw: [string, string][], descending: boolean) {
  return raw
    .map(([price, size]) => [Number(price), Number(size)] as [number, number])
    .filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size) && size > 0)
    .sort((a, b) => descending ? b[0] - a[0] : a[0] - b[0]);
}

function patchLevels(current: [number, number][], incoming: [string, string][], descending: boolean) {
  const result = new Map(current);
  incoming.forEach(([rawPrice, rawSize]) => {
    const price = Number(rawPrice);
    const size = Number(rawSize);
    if (!Number.isFinite(price) || !Number.isFinite(size)) return;
    if (size === 0) result.delete(price);
    else result.set(price, size);
  });
  return [...result.entries()].sort((a, b) => descending ? b[0] - a[0] : a[0] - b[0]);
}

function vwapImpactBps(book: [number, number][], notionalUsd: number) {
  if (!book.length) return null;
  const best = book[0][0];
  let remaining = notionalUsd;
  let base = 0;
  let quote = 0;
  for (const [price, size] of book) {
    const fill = Math.min(price * size, remaining);
    quote += fill;
    base += fill / price;
    remaining -= fill;
    if (remaining <= 0) break;
  }
  return remaining > 0 || base === 0 ? null : Math.abs((quote / base - best) / best) * 10_000;
}

function visibleNotional(book: [number, number][]) {
  return book.reduce((total, [price, size]) => total + price * size, 0);
}

function capacityFor(opportunity: Opportunity, books: LiveBooks) {
  const highBook = books[opportunity.symbol]?.[opportunity.higherFundingVenue] ?? emptyBook;
  const lowVenue = opportunity.higherFundingVenue === "Binance" ? "Bybit" : "Binance";
  const lowBook = books[opportunity.symbol]?.[lowVenue] ?? emptyBook;
  const shortCapacity = visibleNotional(highBook.bids);
  const longCapacity = visibleNotional(lowBook.asks);
  return shortCapacity && longCapacity ? Math.min(shortCapacity, longCapacity) : null;
}

function calculateOpportunities(quotes: LiveQuotes, books: LiveBooks, now: number) {
  return seedInputs.map((seed) => {
    const binance = { ...seed.binance, ...quotes[seed.symbol]?.Binance };
    const bybit = { ...seed.bybit, ...quotes[seed.symbol]?.Bybit };
    const highVenue = binance.rate >= bybit.rate ? "Binance" : "Bybit";
    const lowVenue = highVenue === "Binance" ? "Bybit" : "Binance";
    const highBook = books[seed.symbol]?.[highVenue] ?? emptyBook;
    const lowBook = books[seed.symbol]?.[lowVenue] ?? emptyBook;
    const sellImpact = vwapImpactBps(highBook.bids, seed.notionalUsd);
    const buyImpact = vwapImpactBps(lowBook.asks, seed.notionalUsd);
    const depthSlippageBps = sellImpact === null || buyImpact === null ? seed.depthSlippageBps : sellImpact + buyImpact;
    return calculateOpportunity({ ...seed, binance, bybit, depthSlippageBps }, now);
  }).sort((a, b) => b.modeledNetBps - a.modeledNetBps);
}

function usePublicMarketData() {
  const [quotes, setQuotes] = useState<LiveQuotes>({});
  const [books, setBooks] = useState<LiveBooks>({});
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  useEffect(() => {
    let active = true;
    let binanceLive = false;
    let bybitLive = false;
    const syncState = () => {
      if (!active) return;
      setConnection(binanceLive && bybitLive ? "live" : binanceLive || bybitLive ? "partial" : "fallback");
    };
    const streams = symbols.flatMap((symbol) => {
      const pair = symbol.toLowerCase();
      return [`${pair}@markPrice@1s`, `${pair}@depth20@500ms`];
    });
    const binance = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams.join("/")}`);
    binance.onopen = () => { binanceLive = true; syncState(); };
    binance.onclose = () => { binanceLive = false; syncState(); };
    binance.onerror = syncState;
    binance.onmessage = (event) => {
      const message = JSON.parse(event.data) as { stream?: string; data?: Record<string, unknown> };
      const data = message.data;
      const symbol = String(data?.s ?? "");
      if (!data || !symbols.includes(symbol)) return;
      if (message.stream?.includes("markPrice")) {
        setQuotes((current) => {
          const previous = current[symbol]?.Binance ?? {};
          const rate = asNumber(data.r);
          const markPrice = asNumber(data.p);
          return { ...current, [symbol]: { ...current[symbol], Binance: { ...previous, venue: "Binance", ...(rate === undefined ? {} : { rate }), ...(markPrice === undefined ? {} : { markPrice }), updatedAt: asNumber(data.E) ?? Date.now() } } };
        });
      }
      if (message.stream?.includes("depth")) {
        setBooks((current) => ({ ...current, [symbol]: { ...current[symbol], Binance: { bids: levels((data.b ?? []) as [string, string][], true), asks: levels((data.a ?? []) as [string, string][], false) } } }));
      }
    };

    const bybit = new WebSocket("wss://stream.bybit.com/v5/public/linear");
    const ping = window.setInterval(() => {
      if (bybit.readyState === WebSocket.OPEN) bybit.send(JSON.stringify({ op: "ping" }));
    }, 20_000);
    bybit.onopen = () => {
      bybitLive = true;
      bybit.send(JSON.stringify({ op: "subscribe", args: symbols.flatMap((symbol) => [`tickers.${symbol}`, `orderbook.50.${symbol}`]) }));
      syncState();
    };
    bybit.onclose = () => { bybitLive = false; syncState(); };
    bybit.onerror = syncState;
    bybit.onmessage = (event) => {
      const message = JSON.parse(event.data) as { topic?: string; type?: "snapshot" | "delta"; ts?: number; data?: Record<string, unknown> };
      const topic = message.topic?.split(".") ?? [];
      const kind = topic[0];
      const symbol = topic.at(-1);
      if (!symbol || !symbols.includes(symbol) || !message.data) return;
      if (kind === "tickers") {
        setQuotes((current) => {
          const previous = current[symbol]?.Bybit ?? {};
          const rate = asNumber(message.data?.fundingRate);
          const markPrice = asNumber(message.data?.markPrice);
          const bid = asNumber(message.data?.bid1Price);
          const ask = asNumber(message.data?.ask1Price);
          return { ...current, [symbol]: { ...current[symbol], Bybit: { ...previous, venue: "Bybit", ...(rate === undefined ? {} : { rate }), ...(markPrice === undefined ? {} : { markPrice }), ...(bid === undefined ? {} : { bid }), ...(ask === undefined ? {} : { ask }), updatedAt: message.ts ?? Date.now() } } };
        });
      }
      if (kind === "orderbook") {
        const bids = (message.data.b ?? []) as [string, string][];
        const asks = (message.data.a ?? []) as [string, string][];
        setBooks((current) => {
          const old = current[symbol]?.Bybit ?? emptyBook;
          const next = message.type === "snapshot" ? { bids: levels(bids, true), asks: levels(asks, false) } : { bids: patchLevels(old.bids, bids, true), asks: patchLevels(old.asks, asks, false) };
          return { ...current, [symbol]: { ...current[symbol], Bybit: next } };
        });
      }
    };
    return () => { active = false; window.clearInterval(ping); binance.close(); bybit.close(); };
  }, []);
  return { quotes, books, connection };
}

function Icon({ type }: { type: "sun" | "moon" | "copy" | "arrow" }) {
  const artwork = {
    sun: <><circle cx="12" cy="12" r="3.25" /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28 17.3 6.7M6.7 17.3l-1.42 1.42M18.72 18.72 17.3 17.3M6.7 6.7 5.28 5.28" /></>,
    moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />,
    copy: <><rect x="8" y="8" width="10" height="10" rx="1.5" /><path d="M6 15.5H5.5A1.5 1.5 0 0 1 4 14V5.5A1.5 1.5 0 0 1 5.5 4H14a1.5 1.5 0 0 1 1.5 1.5V6" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{artwork[type]}</svg>;
}

function verdictLabel(status: Opportunity["status"]) {
  return status === "watch" ? "Review" : status === "stale" ? "Stale" : "Reject";
}

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === "frc-theme") onStoreChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function FundingRealityCheck() {
  const { quotes, books, connection } = usePublicMarketData();
  const [now, setNow] = useState(Date.now);
  const theme = useSyncExternalStore<Theme>(subscribeTheme, currentTheme, () => "light");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedSymbol, setSelectedSymbol] = useState("ETHUSDT");
  const [shareState, setShareState] = useState<"idle" | "success" | "failed">("idle");
  const opportunities = useMemo(() => calculateOpportunities(quotes, books, now), [quotes, books, now]);
  const selected = opportunities.find((item) => item.symbol === selectedSymbol) ?? opportunities[0];
  const filtered = filter === "all" ? opportunities : opportunities.filter((item) => item.status === filter);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!selected) return null;
  const maxRaw = Math.max(...opportunities.map((item) => item.grossFundingBps), 1);
  const maxNet = Math.max(...opportunities.map((item) => Math.abs(item.modeledNetBps)), 1);
  const bestRaw = opportunities.reduce((best, item) => item.grossFundingBps > best.grossFundingBps ? item : best, opportunities[0]);
  const averageCost = opportunities.reduce((total, item) => total + item.totalCostBps, 0) / opportunities.length;
  const capacity = capacityFor(selected, books);
  const freshness = Math.max(0, Math.round(selected.freshnessMs / 1_000));

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themeSource = "manual";
    document.documentElement.style.colorScheme = next;
    window.localStorage.setItem("frc-theme", next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };
  const copyVerdict = async () => {
    const stableUrl = verdictUrl(selected.symbol);
    try {
      await navigator.clipboard.writeText(stableUrl);
      setShareState("success");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      setShareState("failed");
      window.setTimeout(() => setShareState("idle"), 2400);
    }
  };
  return <main className="terminal-shell">
    <SiteNav active="scanner" connection={connection} theme={theme} onToggleTheme={toggleTheme} />

    <section className="market-intro" aria-labelledby="market-title">
      <div className="brief-kicker"><span>LIVE FUNDING MONITOR</span><i /> <span>BINANCE × BYBIT</span><b>Read-only model</b></div>
      <div className="brief-copy"><h1 id="market-title">Funding spreads, <em>net of costs.</em></h1><p className="intro-copy">Compare public funding data with fees, visible-book impact, transfer reserve, and liquidation buffer. A positive result is a model state to review, not a trade signal.</p></div>
    </section>

    <section className="pulse-strip" aria-label="Current market state"><div className="pulse-heading"><i /><span>Market state</span></div><div><span>Pairs tracked</span><strong>{symbols.length} perp pairs</strong></div><div><span>Best raw spread</span><strong>{bestRaw.symbol.replace("USDT", "")} · {formatBps(bestRaw.grossFundingBps)}</strong></div><div><span>Best modeled net</span><strong className={opportunities[0].modeledNetBps > 0 ? "signal-positive" : "signal-negative"}>{formatBps(opportunities[0].modeledNetBps)}</strong></div><div><span>Average cost drag</span><strong>−{averageCost.toFixed(1)} bp</strong></div></section>

    <section className="scanner-layout" id="scanner">
      <div className="map-panel">
        <div className="panel-topline"><div><p className="micro-label">OPPORTUNITY MAP</p><h2>Raw spread vs. modeled net</h2></div><div className="segmented" aria-label="Opportunity filter">{(["all", "watch", "rejected", "stale"] as Filter[]).map((option) => <button key={option} className={filter === option ? "active" : ""} onClick={() => setFilter(option)}>{option === "all" ? "All" : verdictLabel(option)}</button>)}</div></div>
        <div className="map-key"><span><i className="key-raw" />Horizontal: funding differential</span><span><i className="key-net" />Vertical: net after costs</span><span><i className="key-size" />Area: visible book capacity</span></div>
        <div className="scatter-wrap" role="group" aria-label="Interactive funding differential scatter plot"><div className="axis axis-y"><span>MODELED NET</span><b>+</b><i>0</i><b>−</b></div><div className="plot"><span className="plot-zero"><i>Break-even after costs</i></span>{filtered.map((item) => {
          const visibleCapacity = capacityFor(item, books);
          const x = 8 + (item.grossFundingBps / maxRaw) * 84;
          const y = 50 - (item.modeledNetBps / maxNet) * 35;
          const size = visibleCapacity ? Math.min(72, Math.max(32, 19 + Math.sqrt(visibleCapacity / 1000) * 8)) : 32;
          return <button key={item.symbol} className={`plot-point point-${item.status} ${selected.symbol === item.symbol ? "point-selected" : ""}`} style={{ "--x": `${x}%`, "--y": `${y}%`, "--point-size": `${size}px` } as React.CSSProperties} onClick={() => setSelectedSymbol(item.symbol)} aria-pressed={selected.symbol === item.symbol} aria-label={`${item.symbol}; ${verdictLabel(item.status)}; funding differential ${formatBps(item.grossFundingBps)}; modeled net ${formatBps(item.modeledNetBps)}${visibleCapacity ? `; visible capacity ${formatUsd(visibleCapacity)}` : "; book capacity unavailable"}`}><AssetMark symbol={item.symbol} size={Math.max(18, Math.min(30, size * .52))} /></button>;
        })}{filtered.length === 0 && <p className="empty-state">No pairs match this filter.</p>}</div><div className="axis axis-x"><span>LOWER DIFFERENTIAL</span><b>FUNDING DIFFERENTIAL</b><span>HIGHER DIFFERENTIAL</span></div></div>
        <div className="mobile-ranks" aria-label="Ranked opportunities">{filtered.map((item) => <button key={item.symbol} className={selected.symbol === item.symbol ? "mobile-selected" : ""} onClick={() => setSelectedSymbol(item.symbol)}><AssetMark symbol={item.symbol} size={22} /><span><strong>{item.symbol.replace("USDT", "")}</strong><small>{item.direction}</small></span><i className={`status-dot dot-${item.status}`} /><strong className={item.modeledNetBps > 0 ? "signal-positive" : "signal-negative"}>{formatBps(item.modeledNetBps)}</strong></button>)}</div>
        <p className="map-footnote">A circle scales by visible capacity only when both streamed books can cover the selected notional. Missing depth never becomes zero impact.</p>
      </div>

      <aside className="evidence-panel" aria-live="polite">
        <div className="evidence-head"><div><p className="micro-label">SELECTED VERDICT</p><h2>{selected.symbol}</h2></div><span className={`verdict-chip chip-${selected.status}`}>{verdictLabel(selected.status)}</span></div>
        <p className="route-line"><span>{selected.higherFundingVenue}</span> short <Icon type="arrow" /> <span>{selected.higherFundingVenue === "Binance" ? "Bybit" : "Binance"}</span> long</p>
        <div className={`net-statement statement-${selected.status}`}><span>MODELED NET / FUNDING INTERVAL</span><strong>{formatBps(selected.modeledNetBps)}</strong><p>{selected.status === "watch" ? "Verify venue constraints before treating this as actionable." : selected.status === "stale" ? "Freshness failed. The figure is intentionally non-actionable." : "Declared costs erase the apparent funding advantage."}</p></div>
        <div className="sources-grid"><div><span>BINANCE</span><strong>{(selected.binance.rate * 100).toFixed(4)}%</strong><small>{formatUsd(selected.binance.markPrice)} mark</small></div><div><span>BYBIT</span><strong>{(selected.bybit.rate * 100).toFixed(4)}%</strong><small>{formatUsd(selected.bybit.markPrice)} mark</small></div></div>
        <div className="waterfall" id="method"><div className="waterfall-head"><span>Cost waterfall</span><small>per interval</small></div><div className="waterfall-row yield"><span>Funding differential</span><strong>+{selected.grossFundingBps.toFixed(2)} bp</strong></div><div className="waterfall-row"><span>Round-trip fees</span><strong>−{selected.roundTripFeeBps.toFixed(2)} bp</strong></div><div className="waterfall-row"><span>{capacity ? "Visible-book impact" : "Depth impact reserve"}</span><strong>−{selected.depthSlippageBps.toFixed(2)} bp</strong></div><div className="waterfall-row"><span>Transfer-time reserve</span><strong>−{selected.transferReserveBps.toFixed(2)} bp</strong></div><div className="waterfall-row"><span>Liquidation buffer</span><strong>−{selected.liquidationBufferBps.toFixed(2)} bp</strong></div><div className="waterfall-total"><span>MODELED NET</span><strong>{formatBps(selected.modeledNetBps)}</strong></div></div>
        <div className="evidence-meta"><div><span>FRESHNESS</span><strong>{freshness}s ago</strong></div><div><span>VISIBLE CAPACITY</span><strong>{capacity ? formatUsd(capacity) : "Waiting for books"}</strong></div><div><span>MODEL NOTIONAL</span><strong>{formatUsd(selected.notionalUsd)}</strong></div></div>
        <button className="share-card" onClick={copyVerdict}><Icon type="copy" />{shareState === "success" ? "Copied public verdict URL" : shareState === "failed" ? "Copy failed — try again" : "Copy this public verdict"}</button><span className="sr-only" role="status" aria-live="polite">{shareState === "success" ? `Copied ${selected.symbol} public verdict URL` : shareState === "failed" ? "Could not copy the verdict URL" : ""}</span><p className="risk-copy">Public market data only. No keys, order routes, transfers, or execution live here. A modeled result is not a fill, guarantee, or recommendation.</p>
      </aside>
    </section>

    <section className="ledger-panel" aria-labelledby="ledger-heading"><div className="panel-topline"><div><p className="micro-label">ACCESSIBLE LEDGER</p><h2 id="ledger-heading">Every verdict, in plain rows.</h2></div><p>Keyboard-select any pair to inspect the same cost stack.</p></div><div className="ledger-scroll"><table><thead><tr><th scope="col">Pair</th><th scope="col">Route</th><th scope="col">Funding diff.</th><th scope="col">Costs</th><th scope="col">Modeled net</th><th scope="col">Freshness</th><th scope="col">Verdict</th></tr></thead><tbody>{opportunities.map((item) => <tr key={item.symbol} className={selected.symbol === item.symbol ? "ledger-selected" : ""}><td><button className="pair-button" onClick={() => setSelectedSymbol(item.symbol)}>{item.symbol}</button></td><td>{item.direction}</td><td>{formatBps(item.grossFundingBps)}</td><td>−{item.totalCostBps.toFixed(2)} bp</td><td className={item.modeledNetBps > 0 ? "signal-positive" : "signal-negative"}>{formatBps(item.modeledNetBps)}</td><td>{Math.max(0, Math.round(item.freshnessMs / 1000))}s</td><td><span className={`ledger-status ledger-${item.status}`}>{verdictLabel(item.status)}</span></td></tr>)}</tbody></table></div></section>
    <NewsBriefs />
    <section className="principle-band"><p><span>Read-only by design.</span> Public feeds, explicit reserves, and a visible cost stack for every pair.</p><div className="principle-band-links"><a href="/methodology">How the model works <Icon type="arrow" /></a><a href="/faq">Read the FAQ <Icon type="arrow" /></a></div></section>
    <footer><span className="footer-brand"><BrandMark />PERP VERDICT / PUBLIC BETA</span><span>MODELED · READ ONLY · NO EXECUTION</span><a className="source-link" href="https://github.com/ychetra/perp-verdict" target="_blank" rel="noreferrer"><span className="source-glyph" aria-hidden="true">&lt;&gt;</span> View source on GitHub ↗</a></footer>
  </main>;
}
