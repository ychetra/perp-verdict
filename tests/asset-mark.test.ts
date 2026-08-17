import { describe, expect, it } from "vitest";
import { assetIconUrl, currentAssetIconSymbols, isSafeAssetIconUrl } from "../components/asset-mark";

const productionAssets = ["BTC", "ETH", "SOL", "XRP", "PORTAL", "H", "ZEC", "BTW", "BEAT", "CYS", "AKE", "DOGE", "ADA", "ACE", "WLD", "LINK", "HEMI", "CHIP", "1000PEPE", "GPS", "APR", "ONDO", "VELVET", "TUT", "WLFI"];

describe("asset icon resolution", () => {
  it("resolves every current production asset to an allowlisted HTTPS source", () => {
    for (const asset of productionAssets) {
      const url = assetIconUrl(`${asset}USDT`);
      expect(url, asset).toBeDefined();
      expect(isSafeAssetIconUrl(url), asset).toBe(true);
    }
  });

  it("does not turn malformed symbols into arbitrary URLs", () => {
    expect(assetIconUrl("https://evil.example/icon.png")).toBeUndefined();
    expect(isSafeAssetIconUrl("https://evil.example/icon.png")).toBe(false);
  });

  it("keeps the current production map aligned with the icon source", () => {
    expect(currentAssetIconSymbols).toEqual(expect.arrayContaining(productionAssets.filter((asset) => asset !== "1000PEPE")));
  });
});
