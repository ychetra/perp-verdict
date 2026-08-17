import { ImageResponse } from "next/og";
import { formatBps, formatUsd } from "@/lib/edge";
import { getVerdict, getVerdictFreshness, getVerdictTimestamp, VERDICT_SYMBOLS } from "@/lib/verdict-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perp Verdict modeled funding truth card";
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return VERDICT_SYMBOLS.map((symbol) => ({ pair: symbol.toLowerCase() }));
}

function pairLabel(symbol: string) {
  return symbol.replace("USDT", " / USDT");
}

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const verdict = getVerdict(pair);
  if (!verdict) return new Response("Not found", { status: 404 });
  const timestamp = getVerdictTimestamp(verdict);
  const positive = verdict.modeledNetBps > 0;
  return new ImageResponse(
    <div style={{ background: "#f5f5f0", color: "#16231f", display: "flex", flexDirection: "column", height: "100%", padding: "48px 56px", width: "100%" }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><span style={{ color: "#2e7d4f", fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>PERP VERDICT</span><span style={{ border: "1px solid #c84c48", color: "#c84c48", fontSize: 15, fontWeight: 700, letterSpacing: 2, padding: "10px 14px" }}>MODELED / NOT EXECUTABLE</span></div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}><span style={{ color: "#65716b", fontSize: 20, letterSpacing: 2 }}>FUNDING TRUTH CARD</span><span style={{ fontSize: 72, fontWeight: 700, letterSpacing: -4, marginTop: 10 }}>{pairLabel(verdict.symbol)}</span><span style={{ color: "#65716b", fontSize: 24, marginTop: 8 }}>{verdict.higherFundingVenue} short → {verdict.higherFundingVenue === "Binance" ? "Bybit" : "Binance"} long</span></div>
      <div style={{ display: "flex", gap: 56, marginTop: 44 }}><div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#65716b", fontSize: 16, letterSpacing: 1 }}>RAW DIFFERENTIAL</span><span style={{ fontSize: 38, fontWeight: 700, marginTop: 7 }}>{formatBps(verdict.grossFundingBps)}</span></div><div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#65716b", fontSize: 16, letterSpacing: 1 }}>MODELED NET</span><span style={{ color: positive ? "#167b51" : "#c84c48", fontSize: 38, fontWeight: 700, marginTop: 7 }}>{formatBps(verdict.modeledNetBps)}</span></div><div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#65716b", fontSize: 16, letterSpacing: 1 }}>COST STACK</span><span style={{ fontSize: 38, fontWeight: 700, marginTop: 7 }}>−{verdict.totalCostBps.toFixed(2)} bp</span></div></div>
      <div style={{ borderTop: "2px solid #d9dfd8", display: "flex", fontSize: 17, marginTop: "auto", paddingTop: 17 }}><span>Fees {verdict.roundTripFeeBps.toFixed(1)} · Depth {verdict.depthSlippageBps.toFixed(1)} · Transfer {verdict.transferReserveBps.toFixed(1)} · Buffer {verdict.liquidationBufferBps.toFixed(1)} bp</span><span style={{ marginLeft: "auto" }}>{timestamp.toISOString().slice(0, 10)} · {getVerdictFreshness(verdict)} · {formatUsd(verdict.notionalUsd)}</span></div>
    </div>,
    { ...size },
  );
}
