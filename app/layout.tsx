import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perp Verdict | Perpetual Funding Arbitrage Scanner",
  description: "Live perpetual funding arbitrage scanner, net of fees, depth, transfer time, and liquidation buffer.",
  applicationName: "Perp Verdict",
  category: "finance",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Perp Verdict",
    title: "Perp Verdict | Perpetual Funding Arbitrage Scanner",
    description: "A read-only perpetual funding scanner that shows what remains after fees, visible depth, transfer time, and liquidation buffer.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perp Verdict modeled funding reality check" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perp Verdict | Perpetual Funding Arbitrage Scanner",
    description: "See the modeled net after fees, visible depth, transfer time, and liquidation buffer.",
    images: ["/opengraph-image"],
  },
};

const themeBootstrap = `
  (function () {
    try {
      var saved = window.localStorage.getItem("frc-theme");
      var isManual = saved === "light" || saved === "dark";
      var theme = isManual ? saved : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.themeSource = isManual ? "manual" : "default";
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.dataset.themeSource = "default";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
