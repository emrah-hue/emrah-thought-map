import assert from "node:assert/strict";
import test from "node:test";
import { circularLayout } from "./circular-layout";
import { focusLayout } from "./focus-layout";
import type { PublicGraph } from "./types";

const data: PublicGraph = {
  nodes: [
    { id: "center", label: "Seçilen konu", nodeClass: "topic", size: 13, summary: "" },
    { id: "area", label: "İlgi alanı", nodeClass: "interest-area", size: 16, summary: "" },
    { id: "method", label: "Yöntem", nodeClass: "methodology", size: 10, summary: "" },
    { id: "project", label: "Üretim", nodeClass: "project", size: 11, summary: "" },
    { id: "other", label: "Bağımsız konu", nodeClass: "topic", size: 13, summary: "" },
  ],
  edges: [
    { id: "a-t", source: "area", target: "center", relation: "interest-area-topic" },
    { id: "t-m", source: "center", target: "method", relation: "topic-methodology" },
    { id: "t-p", source: "center", target: "project", relation: "topic-project" },
  ], generatedAt: "now",
};
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test("selection centers the node with evenly spaced neighbors and moves context beyond the ring", () => {
  const before = structuredClone(data);
  const { positions, radius, sizeRatio } = focusLayout(data, "all", "center");
  assert.deepEqual(positions.get("center"), { x: 0, y: 0 });
  const points = ["area", "method", "project"].map(id => positions.get(id)!);
  const ring = Math.hypot(points[0].x, points[0].y);
  points.forEach(p => near(Math.hypot(p.x, p.y), ring));
  const angles = points.map(p => (Math.atan2(p.y, p.x) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
  angles.forEach((angle, i) => near((angles[(i + 1) % angles.length] - angle + 2 * Math.PI) % (2 * Math.PI), 2 * Math.PI / points.length));
  const other = positions.get("other")!;
  assert.ok(Math.hypot(other.x, other.y) > radius);
  assert.ok(Number.isFinite(sizeRatio) && sizeRatio > 0);
  assert.deepEqual(data, before);
});

test("clearing, missing or filtered-out selections restores the exact category overview", () => {
  assert.deepEqual(focusLayout(data, "all"), circularLayout(data, "all"));
  assert.deepEqual(focusLayout(data, "all", "missing"), circularLayout(data, "all"));
  assert.deepEqual(focusLayout(data, "projects", "center"), circularLayout(data, "projects"));
  const isolated = focusLayout(data, "topics", "center");
  assert.deepEqual(isolated.positions.get("center"), { x: 0, y: 0 });
  assert.ok(!isolated.positions.has("method"));
  assert.ok(Number.isFinite(isolated.radius));
});

test("layout stays deterministic across API order, with labels and membership read from current data", () => {
  const reordered = { ...data, nodes: [...data.nodes].reverse(), edges: [...data.edges].reverse() };
  assert.deepEqual(focusLayout(reordered, "all", "center"), focusLayout(data, "all", "center"));
  const edited = { ...data, nodes: data.nodes.map(node => ({ ...node, label: `Yeni ${node.label}` })), edges: data.edges.slice(0, 1) };
  const positions = focusLayout(edited, "all", "center").positions;
  const method = positions.get("method")!;
  assert.ok(Math.hypot(method.x, method.y) > 180);
});

test("a high-degree neighborhood keeps every real connection, with finite and distinct positions", () => {
  const dense: PublicGraph = {
    nodes: [data.nodes[0], ...Array.from({ length: 60 }, (_, i) => ({ ...data.nodes[2], id: `m-${i}`, label: `Yöntem ${i}` }))],
    edges: Array.from({ length: 60 }, (_, i) => ({ id: `e-${i}`, source: "center", target: `m-${i}`, relation: "topic-methodology" })),
    generatedAt: "now",
  };
  const layout = focusLayout(dense, "all", "center");
  assert.equal(layout.positions.size, 61);
  assert.equal(new Set([...layout.positions.values()].map(p => `${p.x},${p.y}`)).size, 61);
  assert.ok(Number.isFinite(layout.radius) && Number.isFinite(layout.sizeRatio));
});

test("dense context has two staggered regular rings and a separate collision size cap", () => {
  const context = Array.from({ length: 72 }, (_, i) => ({ ...data.nodes[4], id: `outer-${i}`, label: `Dış ${i}`, size: 24 }));
  const graph = { ...data, nodes: [...data.nodes.slice(0, 4), ...context] };
  const layout = focusLayout(graph, "all", "center");
  const sparse = focusLayout(data, "all", "center");
  assert.equal(layout.sizeRatio, sparse.sizeRatio);
  for (const node of data.nodes.slice(0, 4)) assert.deepEqual(layout.positions.get(node.id), sparse.positions.get(node.id));
  const rings = new Map<number, number[]>();
  for (const node of context) {
    const point = layout.positions.get(node.id)!;
    const radius = Math.round(Math.hypot(point.x, point.y));
    const angles = rings.get(radius) ?? [];
    angles.push((Math.atan2(point.y, point.x) + Math.PI * 2) % (Math.PI * 2));
    rings.set(radius, angles);
  }
  assert.equal(rings.size, 2);
  const ringAngles = [...rings.values()];
  for (const angles of ringAngles) {
    assert.equal(angles.length, 36);
    angles.sort((a, b) => a - b);
    angles.forEach((angle, i) => near((angles[(i + 1) % angles.length] - angle + Math.PI * 2) % (Math.PI * 2), Math.PI * 2 / angles.length));
  }
  near(ringAngles[1][0] - ringAngles[0][0], Math.PI / 36);
  assert.ok(layout.contextSizeRatio! > 0);
  for (let i = 0; i < context.length; i++) {
    for (const other of context.slice(i + 1)) {
      const a = layout.positions.get(context[i].id)!;
      const b = layout.positions.get(other.id)!;
      const diameterSum = .65 * (context[i].size + other.size) * layout.contextSizeRatio! * .8;
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > diameterSum);
    }
  }
  assert.deepEqual(focusLayout({ ...graph, nodes: [...graph.nodes].reverse() }, "all", "center"), layout);
});
