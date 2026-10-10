import type { PublicGraph } from "./types";

// A selection is one step of the map. Follow another node to explore the next
// step rather than expanding every ancestor and descendant at once.
export function selectionBranch(data: PublicGraph, selected?: string) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const directIds = new Set<string>();
  const validIds = new Set(data.nodes.map(node => node.id));
  if (!selected || !validIds.has(selected)) return { nodeIds, edgeIds, directIds };
  nodeIds.add(selected);
  for (const edge of data.edges) {
    if (!validIds.has(edge.source) || !validIds.has(edge.target)) continue;
    const neighbor: string | undefined = edge.source === selected ? edge.target : edge.target === selected ? edge.source : undefined;
    if (!neighbor || neighbor === selected) continue;
    directIds.add(neighbor);
    nodeIds.add(neighbor);
    edgeIds.add(edge.id);
  }
  return { nodeIds, edgeIds, directIds };
}
