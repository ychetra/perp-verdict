type Asset = "BTC" | "ETH" | "SOL" | "XRP";

function assetFromSymbol(symbol: string): Asset {
  const asset = symbol.replace(/USDT$/i, "").toUpperCase();
  return asset === "BTC" || asset === "ETH" || asset === "SOL" || asset === "XRP" ? asset : "BTC";
}

export function AssetMark({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const asset = assetFromSymbol(symbol);
  const colors: Record<Asset, string> = { BTC: "#f7931a", ETH: "#627eea", SOL: "#14f195", XRP: "#23292f" };
  return (
    <svg className={`asset-mark asset-${asset.toLowerCase()}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill={colors[asset]} />
      {asset === "BTC" && <path d="M14.9 8.1c-.3-1.2-1.3-1.8-2.8-1.9V4.5h-1.4v1.7H9.6V4.5H8.2v1.8H6.7v1.5h1.1l.6 7.4H7.1v1.5h1.5v1.8H10v-1.8h1.1v1.8h1.4v-1.8c2.1-.2 3.4-1.1 3.5-2.8.1-1.1-.5-1.9-1.6-2.4.8-.5 1.1-1.2.9-2.3Zm-4.2-.2c1.7 0 2.5.3 2.6 1.2.1.9-.7 1.3-2.3 1.3h-.1l-.2-2.5Zm.5 6.9-.2-2.8h.6c1.8 0 2.7.4 2.7 1.4 0 1-1 1.4-2.9 1.4h-.2Z" fill="#fff" />}
      {asset === "ETH" && <path d="m12 3.3-5.3 8.8L12 15l5.3-2.9L12 3.3Zm0 13.2L6.7 13.5 12 20.7l5.3-7.2L12 16.5Z" fill="#fff" opacity=".92" />}
      {asset === "SOL" && <><path d="m6.3 7.1 2-2h9.3l-2 2H6.3Zm2.1 4 2-2h7.3l-2 2H8.4Zm-2.7 4.1 2-2H17l-2 2H5.7Z" fill="#0b1210" /><path d="m8.3 5.1-2 2h9.3l2-2H8.3Zm2.1 4-2 2h7.3l2-2h-7.3Zm-2.7 4.1-2 2H15l2-2H7.7Z" fill="#fff" opacity=".9" /></>}
      {asset === "XRP" && <path d="M6 7.1h2.1l2.2 2.2c.9.9 2.5.9 3.4 0l2.2-2.2H18l-3.1 3.1c-1.6 1.6-4.2 1.6-5.8 0L6 7.1Zm0 9.8h2.1l2.2-2.2c.9-.9 2.5-.9 3.4 0l2.2 2.2H18l-3.1-3.1c-1.6-1.6-4.2-1.6-5.8 0L6 16.9Z" fill="#fff" />}
    </svg>
  );
}
