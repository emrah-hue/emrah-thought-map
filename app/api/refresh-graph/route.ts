import { NextRequest, NextResponse } from "next/server";
import { refreshPublicGraph } from "@/lib/graph/data-source";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const graph = await refreshPublicGraph();
    return NextResponse.json(graph, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Harita şu anda güncellenemiyor." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
