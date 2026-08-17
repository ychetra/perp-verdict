"use client";

import { useEffect, useState } from "react";
import type { NewsItem, NewsResponse } from "@/lib/news";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function Headline({ item }: { item: NewsItem }) {
  return <li><a href={item.url} target="_blank" rel="noreferrer"><span>{item.title}</span><small>{item.source} · {formatDate(item.publishedAt)} ↗</small></a></li>;
}

function Lane({ label, items }: { label: string; items: NewsItem[] }) {
  return <div className="briefs-lane"><div className="briefs-lane-head"><span>{label}</span><small>linked headlines</small></div>{items.length ? <ul>{items.map((item) => <Headline key={`${item.source}-${item.url}`} item={item} />)}</ul> : <p className="briefs-empty">No linked headlines available from this lane.</p>}</div>;
}

export function NewsBriefs() {
  const [response, setResponse] = useState<NewsResponse | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/briefs").then((result) => result.json() as Promise<NewsResponse>).then((next) => { if (active) setResponse(next); }).catch(() => { if (active) setResponse({ kind: "unavailable", generatedAt: new Date().toISOString(), message: "Linked news is temporarily unavailable. The funding scanner is still live." }); });
    return () => { active = false; };
  }, []);
  return <section className="briefs-panel" aria-labelledby="briefs-heading"><div className="briefs-intro"><p className="micro-label">EXTERNAL CONTEXT</p><h2 id="briefs-heading">What is moving around the feed.</h2><p>Selected links from established publishers for context. Headlines are not part of the funding calculation.</p></div>{response?.kind === "unavailable" ? <p className="briefs-unavailable">{response.message}</p> : response?.kind === "available" ? <div className="briefs-grid"><Lane label="Crypto market" items={response.items.crypto} /><Lane label="AI & infrastructure" items={response.items.ai} /></div> : <div className="briefs-loading" aria-live="polite">Loading linked headlines…</div>}<p className="briefs-disclosure">Linked headlines · refreshing periodically · does not change the funding verdict.</p></section>;
}
