import { useState } from "react";

const COINGECKO_ICON_URLS: Record<string, string> = {
  "1000PEPE": "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696528776",
  ACE: "https://coin-images.coingecko.com/coins/images/33528/large/ACE.png?1702254943", ADA: "https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090", AKE: "https://coin-images.coingecko.com/coins/images/68410/large/akedo.png?1755678461", APR: "https://coin-images.coingecko.com/coins/images/70220/large/capricorn.jpg?1786687781", BEAT: "https://coin-images.coingecko.com/coins/images/70428/large/audiera.png?1761964064", BTC: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400", BTW: "https://coin-images.coingecko.com/coins/images/71205/large/BTW_Token_200x200.png?1786291907", CHIP: "https://coin-images.coingecko.com/coins/images/102171777/large/CHIP_Token_Logo_Large.png?1776777444", CYS: "https://coin-images.coingecko.com/coins/images/71025/large/cysic.png?1765330348", DOGE: "https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501409", ETH: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628", GPS: "https://coin-images.coingecko.com/coins/images/53686/large/Separate_logo%EF%BC%88green%EF%BC%89.png?1737033911", H: "https://coin-images.coingecko.com/coins/images/66811/large/H_tokenLogo_original.png?1750581252", HEMI: "https://coin-images.coingecko.com/coins/images/68469/large/hemi.png?1755838145", LINK: "https://coin-images.coingecko.com/coins/images/877/large/Chainlink_Logo_500.png?1760023405", ONDO: "https://coin-images.coingecko.com/coins/images/26580/large/ONDO.png?1696525656", PEPE: "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696528776", PORTAL: "https://coin-images.coingecko.com/coins/images/35436/large/portal.jpeg?1708590254", SOL: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756", TUT: "https://coin-images.coingecko.com/coins/images/54299/large/image_2025-02-08_18-56-13.png?1739165439", VELVET: "https://coin-images.coingecko.com/coins/images/67194/large/velvet.jpg?1752054592", WLD: "https://coin-images.coingecko.com/coins/images/31069/large/worldcoin.jpeg?1696529903", WLFI: "https://coin-images.coingecko.com/coins/images/50767/large/wlfi.png?1756438915", XRP: "https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442", ZEC: "https://coin-images.coingecko.com/coins/images/486/large/Brandmark-Yellow_%281%29.png?1785810558",
};

const COINGECKO_HOST = "coin-images.coingecko.com";
const COINCAP_HOST = "assets.coincap.io";

function assetFromSymbol(symbol: string) {
  const asset = symbol.replace(/USDT$/i, "").toUpperCase();
  return /^[A-Z0-9]+$/.test(asset) ? asset : "";
}

export function assetIconUrl(symbol: string) {
  const asset = assetFromSymbol(symbol);
  return COINGECKO_ICON_URLS[asset] ?? (asset ? `https://${COINCAP_HOST}/assets/icons/${asset.toLowerCase()}@2x.png` : undefined);
}

export function isSafeAssetIconUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === COINGECKO_HOST || url.hostname === COINCAP_HOST) && url.pathname.startsWith("/");
  } catch { return false; }
}

function NeutralAssetMark({ size }: { size: number }) {
  return <svg className="asset-mark asset-generic" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="#68736d" /><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="1.5" /><path d="M12 5.5v2M12 16.5v2M5.5 12h2M16.5 12h2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

export function AssetMark({ symbol, size = 20, decorative = false }: { symbol: string; size?: number; decorative?: boolean }) {
  const asset = assetFromSymbol(symbol);
  const url = assetIconUrl(symbol);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!isSafeAssetIconUrl(url) || failedUrl === url) return <NeutralAssetMark size={size} />;
  // Remote CDN images are deliberate here: Next Image optimization would add a proxy dependency.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`asset-mark asset-${asset.toLowerCase()}`} src={url} width={size} height={size} alt={decorative ? "" : `${asset || "Asset"} icon`} aria-hidden={decorative ? true : undefined} loading="lazy" decoding="async" onError={() => setFailedUrl(url)} />;
}

export const currentAssetIconSymbols = Object.keys(COINGECKO_ICON_URLS);
