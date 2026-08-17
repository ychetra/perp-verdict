import { ImageResponse } from "next/og";

export const alt = "Perp Verdict modeled perpetual funding reality check";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ background: "#f5f5f0", color: "#16231f", display: "flex", flexDirection: "column", height: "100%", padding: "64px 72px", width: "100%" }}>
      <div style={{ color: "#2e7d4f", display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>PERP VERDICT</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 62 }}>
        <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: -3 }}>Funding reality, with the</div>
        <div style={{ color: "#2e7d4f", fontSize: 58, fontWeight: 700, letterSpacing: -3 }}>costs left in.</div>
      </div>
      <div style={{ borderTop: "2px solid #d9dfd8", display: "flex", fontSize: 19, marginTop: "auto", paddingTop: 22 }}>
        <span>Binance × Bybit</span><span style={{ marginLeft: "auto" }}>MODELED / NOT EXECUTABLE</span>
      </div>
    </div>,
    { ...size },
  );
}
