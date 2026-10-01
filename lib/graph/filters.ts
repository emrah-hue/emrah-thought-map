import type { GraphFilter, PublicGraphNode } from "./types";
const ACTIVE = new Set(["Geliştiriliyor", "Deneniyor", "Uygulamada"]);
export function matchesFilter(node: PublicGraphNode, filter: GraphFilter) {
  if (filter === "interest-areas") return node.nodeClass === "interest-area";
  if (filter === "topics") return node.nodeClass === "topic";
  if (filter === "methodologies") return node.nodeClass === "methodology";
  if (filter === "projects") return node.nodeClass === "project";
  if (filter === "current") return node.nodeClass === "methodology" && ACTIVE.has(node.stage ?? "");
  return true;
}
