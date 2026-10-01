import type { NodeClass } from "./types";

export const NODE_SIZE: Record<NodeClass, number> = {
  "interest-area": 16,
  topic: 13,
  methodology: 10,
  project: 11,
};

export const NODE_COLOR: Record<NodeClass, string> = {
  "interest-area": "#68756a",
  topic: "#858f72",
  methodology: "#a75b3e",
  project: "#496a78",
};

export const nodeSize = (nodeClass: NodeClass) => NODE_SIZE[nodeClass];
export const nodeOpacity = (stage?: string) => stage === "Tohum" ? 0.72 : stage === "Yerleşik" ? 0.9 : 1;
