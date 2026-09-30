import type { GraphFilter, PublicGraphNode } from "./types";
const ACTIVE=new Set(["Geliştiriliyor","Deneniyor","Uygulamada"]);
const METHODS=new Set(["Metodoloji","Model","Çerçeve"]);
export function matchesFilter(node:PublicGraphNode, filter:GraphFilter) {
  if(filter==="topics") return node.nodeClass==="topic";
  if(filter==="methods") return node.nodeClass==="knowledge" && METHODS.has(node.subtype);
  if(filter==="current") return node.nodeClass==="knowledge" && ACTIVE.has(node.stage ?? "");
  return true;
}
