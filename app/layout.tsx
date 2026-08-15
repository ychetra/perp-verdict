import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perp Verdict | Perpetual Funding Arbitrage Scanner",
  description: "Live perpetual funding arbitrage scanner, net of fees, depth, transfer time, and liquidation buffer.",
  applicationName: "Perp Verdict",
  category: "finance",
};

const themeBootstrap = `
  (function () {
    try {
      var saved = window.localStorage.getItem("frc-theme");
      var isManual = saved === "light" || saved === "dark";
      var theme = isManual
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.themeSource = isManual ? "manual" : "system";
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      var fallback = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = fallback;
      document.documentElement.dataset.themeSource = "system";
      document.documentElement.style.colorScheme = fallback;
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
