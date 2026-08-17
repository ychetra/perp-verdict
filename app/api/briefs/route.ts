import { getNewsBriefs } from "@/lib/news";

export const revalidate = 900;
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getNewsBriefs(), { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
}
