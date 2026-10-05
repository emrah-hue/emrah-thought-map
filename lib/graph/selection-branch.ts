import type { PublicGraph, PublicGraphEdge } from "./types";

// Follow the hierarchy inward and outward separately. Walking an undirected
// connected component would also pull in unrelated siblings through shared nodes.
export function selectionBranch(data: PublicGraph, selected?: string) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const directIds = new Set<string>();
  const validIds = new Set(data.nodes.map(node => node.id));
  if (!selected || !validIds.has(selected)) return { nodeIds, edgeIds, directIds };
  nodeIds.add(selected);
  const incoming = new Map<string, PublicGraphEdge[]>();
  const outgoing = new Map<string, PublicGraphEdge[]>();
  const edges = data.edges.filter(edge => validIds.has(edge.source) && validIds.has(edge.target));
  for (const edge of edges) {
    if (edge.source === selected) directIds.add(edge.target);
    if (edge.target === selected) directIds.add(edge.source);
    if (edge.relation === "methodology-relationship") continue;
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }
  for (const direction of ["inward", "outward"] as const) {
    const seen = new Set([selected]);
    const pending = [selected];
    const adjacency = direction === "inward" ? incoming : outgoing;
    while (pending.length) {
      for (const edge of adjacency.get(pending.pop()!) ?? []) {
        const id = direction === "inward" ? edge.source : edge.target;
        nodeIds.add(id);
        edgeIds.add(edge.id);
        if (!seen.has(id)) { seen.add(id); pending.push(id); }
      }
    }
  }
  // Preserve direct methodology relationships without using them to expand
  // across every other branch of the map.
  for (const edge of edges) {
    if (edge.relation !== "methodology-relationship") continue;
    if (edge.source === selected || edge.target === selected) {
      nodeIds.add(edge.source); nodeIds.add(edge.target);
    }
  }
  for (const edge of edges) {
    if (edge.relation === "methodology-relationship" && nodeIds.has(edge.source) && nodeIds.has(edge.target)) edgeIds.add(edge.id);
  }
  return { nodeIds, edgeIds, directIds };
}
