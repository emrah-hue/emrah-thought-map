import { circularLayout } from "./circular-layout";
import { matchesFilter } from "./filters";
import { selectionBranch } from "./selection-branch";
import type { GraphFilter, NodeClass, PublicGraph } from "./types";

const LAYERS: NodeClass[] = ["interest-area", "topic", "methodology", "project"];
const TAU = Math.PI * 2;

// Derive positions only from the current graph. The canonical nodes and edges
// remain untouched, including multi-parent records and horizontal relations.
export function focusLayout(data: PublicGraph, filter: GraphFilter, selected?: string) {
  const overview = circularLayout(data, filter);
  if (!selected || !overview.positions.has(selected)) return overview;
  const branch = selectionBranch(data, selected);
  const visible = data.nodes.filter(node => matchesFilter(node, filter));
  const neighbors = visible.filter(node => branch.directIds.has(node.id)).sort((a, b) =>
    LAYERS.indexOf(a.nodeClass) - LAYERS.indexOf(b.nodeClass) ||
    a.label.localeCompare(b.label, "tr") || a.id.localeCompare(b.id));
  const ringRadius = Math.max(180, neighbors.length * 110 / TAU);
  const radius = ringRadius * 1.5;
  const positions = new Map(overview.positions);
  positions.set(selected, { x: 0, y: 0 });
  neighbors.forEach((node, index) => {
    const angle = Math.PI / 2 + index * TAU / neighbors.length;
    positions.set(node.id, { x: Math.cos(angle) * ringRadius, y: Math.sin(angle) * ringRadius });
  });
  for (const node of visible) {
    if (branch.nodeIds.has(node.id)) continue;
    const original = overview.positions.get(node.id)!;
    const angle = Math.atan2(original.y, original.x);
    const outerRadius = ringRadius * (1.7 + .3 * Math.hypot(original.x, original.y) / overview.radius);
    positions.set(node.id, { x: Math.cos(angle) * outerRadius, y: Math.sin(angle) * outerRadius });
  }
  const focused = visible.filter(node => branch.nodeIds.has(node.id));
  let sizeRatio = Infinity;
  focused.forEach((node, i) => {
    const a = positions.get(node.id)!;
    for (const other of focused.slice(i + 1)) {
      const b = positions.get(other.id)!;
      sizeRatio = Math.min(sizeRatio, Math.hypot(a.x - b.x, a.y - b.y) / (node.size + other.size));
    }
  });
  return { positions, radius, sizeRatio };
}
