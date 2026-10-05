import { matchesFilter } from "./filters";
import type { GraphFilter, NodeClass, PublicGraph, PublicGraphNode } from "./types";

const LAYERS: NodeClass[] = ["interest-area", "topic", "methodology", "project"];
const TAU = Math.PI * 2;
type Position = { x: number; y: number };

export function circularLayout(data: PublicGraph, filter: GraphFilter) {
  const positions = new Map<string, Position>();
  const angles = new Map<string, number>();
  const visible = data.nodes.filter(node => matchesFilter(node, filter));
  const neighbors = new Map(data.nodes.map(node => [node.id, new Set<string>()]));
  for (const edge of data.edges) {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }
  let radius = 0;
  const compare = (a: PublicGraphNode, b: PublicGraphNode) =>
    a.label.localeCompare(b.label, "tr") || a.id.localeCompare(b.id);

  for (const layer of LAYERS) {
    const nodes = visible.filter(node => node.nodeClass === layer).sort(compare);
    if (!nodes.length) continue;
    // A circular mean keeps neighbors near the same direction across rings.
    // Every ring still has equal angular spacing, including disconnected nodes.
    const anchors = new Map<string, number>();
    for (const node of nodes) {
      let x = 0, y = 0, count = 0;
      for (const id of neighbors.get(node.id) ?? []) {
        const angle = angles.get(id);
        if (angle === undefined) continue;
        x += Math.cos(angle); y += Math.sin(angle); count++;
      }
      if (count && Math.hypot(x, y) > 1e-8) anchors.set(node.id, (Math.atan2(y, x) + TAU) % TAU);
    }
    nodes.sort((a, b) => (anchors.get(a.id) ?? TAU) - (anchors.get(b.id) ?? TAU) || compare(a, b));
    let rotationX = 0, rotationY = 0;
    nodes.forEach((node, index) => {
      const anchor = anchors.get(node.id);
      if (anchor === undefined) return;
      const offset = anchor - index * TAU / nodes.length;
      rotationX += Math.cos(offset); rotationY += Math.sin(offset);
    });
    const rotation = Math.hypot(rotationX, rotationY) > 1e-8 ? Math.atan2(rotationY, rotationX) : Math.PI / 2;
    const spacing = Math.max(...nodes.map(node => node.size)) * 2 + 32;
    radius = Math.max(radius + 90, 110, nodes.length * spacing / TAU);
    nodes.forEach((node, index) => {
      const angle = rotation + index * TAU / nodes.length;
      angles.set(node.id, angle);
      positions.set(node.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    });
  }
  if (visible.length === 1) positions.set(visible[0].id, { x: 0, y: 0 });
  // Fit node sizes as well as positions on narrow screens. The closest pair
  // sets a uniform size limit; zooming continues to use Sigma's native scaling.
  let sizeRatio = Infinity;
  visible.forEach((node, i) => {
    const a = positions.get(node.id)!;
    for (const other of visible.slice(i + 1)) {
      const b = positions.get(other.id)!;
      sizeRatio = Math.min(sizeRatio, Math.hypot(a.x - b.x, a.y - b.y) / (node.size + other.size));
    }
  });
  return { positions, radius: radius || 110, sizeRatio };
}
