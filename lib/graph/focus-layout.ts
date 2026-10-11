import { circularLayout } from "./circular-layout";
import { matchesFilter } from "./filters";
import { selectionBranch } from "./selection-branch";
import type { GraphFilter, NodeClass, PublicGraph } from "./types";

const LAYERS: NodeClass[] = ["interest-area", "topic", "methodology", "project"];
const TAU = Math.PI * 2;

// Derive positions only from the current graph. The canonical nodes and edges
// remain untouched, including multi-parent records and horizontal relations.
export function focusLayout(data: PublicGraph, filter: GraphFilter, selected?: string): ReturnType<typeof circularLayout> & { contextSizeRatio?: number } {
  const overview = circularLayout(data, filter);
  if (!selected || !overview.positions.has(selected)) return overview;
  const branch = selectionBranch(data, selected, filter);
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
  const context = visible.filter(node => !branch.nodeIds.has(node.id));
  const anchors = new Map(context.map(node => [node.id, { x: 0, y: 0 }]));
  for (const edge of data.edges) {
    if (!branch.contextEdgeIds.has(edge.id)) continue;
    const inner = branch.directIds.has(edge.source) ? edge.source : edge.target;
    const outer = inner === edge.source ? edge.target : edge.source;
    const anchor = anchors.get(outer)!;
    const position = positions.get(inner)!;
    anchor.x += position.x / ringRadius;
    anchor.y += position.y / ringRadius;
  }
  const angleFor = (id: string) => {
    const anchor = anchors.get(id)!;
    const point = Math.hypot(anchor.x, anchor.y) > 1e-8 ? anchor : overview.positions.get(id)!;
    return (Math.atan2(point.y, point.x) + TAU) % TAU;
  };
  context.sort((a, b) => angleFor(a.id) - angleFor(b.id) || a.id.localeCompare(b.id));
  // Dense context uses two evenly spaced, staggered rings rather than stacking
  // nodes at the old category angles. Connection anchors only decide order.
  const ringCount = context.length > 36 ? 2 : 1;
  for (let ring = 0; ring < ringCount; ring++) {
    const nodes = context.filter((_, index) => index % ringCount === ring);
    const outerRadius = ringRadius * (1.72 + ring * .36);
    nodes.forEach((node, index) => {
      const angle = (index + ring / ringCount) * TAU / nodes.length;
      positions.set(node.id, { x: Math.cos(angle) * outerRadius, y: Math.sin(angle) * outerRadius });
    });
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
  // Context has its own size cap so crowded outer rings never shrink the
  // selected node or its direct neighbors. Leave a gap between every pair.
  let contextSizeRatio = Infinity;
  context.forEach((node, i) => {
    const a = positions.get(node.id)!;
    for (const other of context.slice(i + 1)) {
      const b = positions.get(other.id)!;
      contextSizeRatio = Math.min(contextSizeRatio, Math.hypot(a.x - b.x, a.y - b.y) / (.65 * (node.size + other.size)));
    }
  });
  return { positions, radius, sizeRatio, contextSizeRatio };
}
