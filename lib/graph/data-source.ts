import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { buildPublicGraph } from "./build-public-graph";
import { mockSource } from "./mock-data";
import { fetchNotionSource } from "@/lib/notion/notion-adapter";
import type { PublicGraph } from "./types";

async function load(){ return buildPublicGraph(process.env.GRAPH_SOURCE === "notion" ? await fetchNotionSource() : mockSource); }
export const getPublicGraph=unstable_cache(load,["public-thought-graph"],{revalidate:86400,tags:["public-thought-graph"]});

// The minute is part of the persistent cache key: repeated refreshes share a
// snapshot, while a new minute performs a blocking fetch from the source.
const getRefreshSnapshot=unstable_cache(async (minute:number)=>{
  void minute;
  return load();
},["public-thought-graph-refresh",process.env.GRAPH_SOURCE ?? "mock"],{revalidate:120});
const inFlightRefreshes=new Map<number,Promise<PublicGraph>>();

export async function refreshPublicGraph(){
  const minute=Math.floor(Date.now()/60000);
  const pending=inFlightRefreshes.get(minute) ?? getRefreshSnapshot(minute);
  inFlightRefreshes.set(minute,pending);
  try {
    const graph=await pending;
    // Only expire the published graph after a successful fetch.
    revalidateTag("public-thought-graph");
    return graph;
  } finally {
    if(inFlightRefreshes.get(minute)===pending) inFlightRefreshes.delete(minute);
  }
}
