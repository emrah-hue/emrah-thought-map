import "server-only";
import { unstable_cache } from "next/cache";
import { buildPublicGraph } from "./build-public-graph";
import { mockSource } from "./mock-data";
import { fetchNotionSource } from "@/lib/notion/notion-adapter";

async function load(){ return buildPublicGraph(process.env.GRAPH_SOURCE === "notion" ? await fetchNotionSource() : mockSource); }
export const getPublicGraph=unstable_cache(load,["public-thought-graph"],{revalidate:86400,tags:["public-thought-graph"]});
