import { getBinanceQuotes } from "@/lib/binance-quotes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await getBinanceQuotes();
  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
