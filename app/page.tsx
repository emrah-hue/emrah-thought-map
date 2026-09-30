import { ThoughtMap } from "@/components/graph/ThoughtMap";
import { getPublicGraph } from "@/lib/graph/data-source";

export const revalidate = 86400;

export default async function Home() {
  const graph = await getPublicGraph();
  return <main><ThoughtMap data={graph} /></main>;
}
