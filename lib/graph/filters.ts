import type { GraphFilter, PublicGraphNode } from "./types";
export function matchesFilter(node: PublicGraphNode, filter: GraphFilter) {
  if (filter === "interest-areas") return node.nodeClass === "interest-area";
  if (filter === "topics") return node.nodeClass === "topic";
  if (filter === "methodologies") return node.nodeClass === "methodology";
  if (filter === "projects") return node.nodeClass === "project";
  return true;
}
