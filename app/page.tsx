import { FundingRealityCheck } from "@/components/funding-reality-check";
import { SITE_URL } from "@/lib/site";

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Perp Verdict",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: "A live, read-only perpetual funding arbitrage scanner that models fees, visible depth, transfer time, and liquidation buffer.",
    featureList: "Funding differential, fee drag, visible-book impact, transfer-time reserve, liquidation buffer",
    isAccessibleForFree: true,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    <FundingRealityCheck />
  </>;
}
