import { FundingRealityCheck } from "@/components/funding-reality-check";

export default function Home() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Perp Verdict",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: "A live, read-only perpetual funding arbitrage scanner that models fees, visible depth, transfer time, and liquidation buffer.",
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    <FundingRealityCheck />
  </>;
}
