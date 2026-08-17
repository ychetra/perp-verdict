import { getCachedSnapshot } from "@/lib/server-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 15;

export async function GET(_request: Request, { params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const result = await getCachedSnapshot(pair);
  return Response.json(result, {
    headers: {
      "Cache-Control": "public, max-age=15, s-maxage=15, stale-while-revalidate=15",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
