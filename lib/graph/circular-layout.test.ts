import assert from "node:assert/strict";
import test from "node:test";
import { circularLayout } from "./circular-layout";
import { matchesFilter } from "./filters";
import type { GraphFilter, NodeClass, PublicGraph } from "./types";

const layers: NodeClass[] = ["interest-area", "topic", "methodology", "project"];
const data: PublicGraph = {
  nodes: layers.flatMap((nodeClass, layer) => Array.from({ length: layer + 3 }, (_, i) => ({
    id: `${nodeClass}-${i}`, label: `${nodeClass} ${i}`, nodeClass, size: 16 - layer, summary: "",
  }))),
  edges: [
    { id: "a-t", source: "interest-area-0", target: "topic-0", relation: "interest-area-topic" },
    { id: "t-m", source: "topic-0", target: "methodology-0", relation: "topic-methodology" },
    { id: "m-p", source: "methodology-0", target: "project-0", relation: "methodology-project" },
    { id: "m-m", source: "methodology-0", target: "methodology-1", relation: "methodology-relationship" },
  ],
  generatedAt: "now",
};
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test("overview puts the four layers on concentric, evenly spaced rings without changing data", () => {
  const before = structuredClone(data);
  const { positions, radius, sizeRatio } = circularLayout(data, "all");
  let previousRadius = 0;
  for (const layer of layers) {
    const points = data.nodes.filter(n => n.nodeClass === layer).map(n => positions.get(n.id)!);
    const r = Math.hypot(points[0].x, points[0].y);
    assert.ok(r > previousRadius);
    const angles = points.map(p => (Math.atan2(p.y, p.x) + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
    points.forEach(p => near(Math.hypot(p.x, p.y), r));
    angles.forEach((angle, i) => near((angles[(i + 1) % angles.length] - angle + Math.PI * 2) % (Math.PI * 2), Math.PI * 2 / angles.length));
    previousRadius = r;
  }
  near(radius, previousRadius);
  assert.ok(sizeRatio > 0);
  assert.deepEqual(data, before);
});

test("each category opens into one complete ring and restoring all gives the original layout", () => {
  const initial = circularLayout(data, "all");
  const filters: GraphFilter[] = ["interest-areas", "topics", "methodologies", "projects"];
  for (const filter of filters) {
    const { positions, radius } = circularLayout(data, filter);
    assert.deepEqual([...positions.keys()].sort(), data.nodes.filter(n => matchesFilter(n, filter)).map(n => n.id).sort());
    for (const p of positions.values()) near(Math.hypot(p.x, p.y), radius);
  }
  assert.deepEqual(circularLayout(data, "all"), initial);
});

test("layout is stable when the API returns nodes or edges in a different order", () => {
  const reordered = { ...data, nodes: [...data.nodes].reverse(), edges: [...data.edges].reverse() };
  for (const filter of ["all", "topics", "methodologies"] as GraphFilter[]) {
    assert.deepEqual(circularLayout(reordered, filter).positions, circularLayout(data, filter).positions);
  }
});

test("connected outer nodes are oriented toward their inner neighbors", () => {
  const { positions } = circularLayout(data, "all");
  for (const edge of data.edges.filter(e => e.relation !== "methodology-relationship")) {
    const a = positions.get(edge.source)!, b = positions.get(edge.target)!;
    near(a.x / Math.hypot(a.x, a.y), b.x / Math.hypot(b.x, b.y));
    near(a.y / Math.hypot(a.x, a.y), b.y / Math.hypot(b.x, b.y));
  }
});

test("empty, single-node and missing-layer graphs have finite bounds and no overlapping positions", () => {
  const empty = circularLayout({ ...data, nodes: [], edges: [] }, "all");
  assert.equal(empty.positions.size, 0);
  assert.ok(Number.isFinite(empty.radius));
  const single = circularLayout({ ...data, nodes: [data.nodes[0]], edges: [] }, "all");
  assert.deepEqual(single.positions.get(data.nodes[0].id), { x: 0, y: 0 });
  const partial = circularLayout({ ...data, nodes: data.nodes.filter(n => n.nodeClass === "project"), edges: [] }, "all");
  assert.equal(new Set([...partial.positions.values()].map(p => `${p.x},${p.y}`)).size, partial.positions.size);
  assert.ok(Number.isFinite(partial.sizeRatio) && partial.sizeRatio > 0);
});
