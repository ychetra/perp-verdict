import { getCachedUniverse } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const revalidate = 900;

export async function GET() {
  const result = await getCachedUniverse();
  return Response.json(result, {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=900",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
