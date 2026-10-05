import type { NodeClass } from "./types";

export const NODE_SIZE: Record<NodeClass, number> = {
  "interest-area": 16,
  topic: 13,
  methodology: 10,
  project: 11,
};

export const NODE_COLOR: Record<NodeClass, string> = {
  "interest-area": "#367568",
  topic: "#6267a3",
  methodology: "#b65d3e",
  project: "#a47c2a",
};

// Blend against the paper instead of using WebGL alpha, so crossing edges
// stay quiet and Sigma's premultiplied blending cannot brighten the palette.
export const PAPER_COLOR = "#f2f0e9";
export function paperBlend(color: string, opacity: number): string {
  const channels = [1, 3, 5].map((offset) => {
    const ink = parseInt(color.slice(offset, offset + 2), 16);
    const paper = parseInt(PAPER_COLOR.slice(offset, offset + 2), 16);
    return Math.round(ink * opacity + paper * (1 - opacity)).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

export const nodeSize = (nodeClass: NodeClass) => NODE_SIZE[nodeClass];
export const nodeOpacity = (stage?: string) => stage === "Tohum" ? 0.72 : stage === "Yerleşik" ? 0.9 : 1;
