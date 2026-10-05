import assert from "node:assert/strict";
import test from "node:test";
import { selectionBranch } from "./selection-branch";
import type { NodeClass, PublicGraph, PublicGraphEdge } from "./types";

const nodes: [string, NodeClass][] = [
  ["music", "interest-area"], ["production", "topic"], ["choirs", "project"], ["oceans", "project"],
  ["work", "interest-area"], ["learning", "topic"], ["checkup", "methodology"], ["navigator", "project"],
  ["other-topic", "topic"], ["peer", "methodology"], ["distant-peer", "methodology"], ["unlinked", "project"],
];
const edge = (source: string, target: string, relation: PublicGraphEdge["relation"]): PublicGraphEdge => ({
  id: `${source}-${target}`, source, target, relation,
});
const data: PublicGraph = {
  nodes: nodes.map(([id, nodeClass]) => ({ id, nodeClass, label: id, summary: "", size: 10 })),
  edges: [
    edge("music", "production", "interest-area-topic"),
    edge("production", "choirs", "topic-project"), edge("production", "oceans", "topic-project"),
    edge("work", "learning", "interest-area-topic"), edge("work", "other-topic", "interest-area-topic"),
    edge("learning", "checkup", "topic-methodology"), edge("checkup", "navigator", "methodology-project"),
    edge("other-topic", "navigator", "topic-project"),
    edge("checkup", "peer", "methodology-relationship"), edge("peer", "distant-peer", "methodology-relationship"),
  ], generatedAt: "now",
};
const sorted = (set: Set<string>) => [...set].sort();

test("music selection includes both projects through its topic, without requiring a methodology", () => {
  const before = structuredClone(data);
  const branch = selectionBranch(data, "music");
  assert.deepEqual(sorted(branch.nodeIds), ["choirs", "music", "oceans", "production"]);
  assert.deepEqual(sorted(branch.edgeIds), ["music-production", "production-choirs", "production-oceans"]);
  assert.deepEqual(sorted(branch.directIds), ["production"]);
  assert.deepEqual(data, before);
});

test("topic selection includes inward areas and outward methodologies and projects", () => {
  const branch = selectionBranch(data, "learning");
  assert.deepEqual(sorted(branch.nodeIds), ["checkup", "learning", "navigator", "work"]);
  assert.deepEqual(sorted(branch.edgeIds), ["checkup-navigator", "learning-checkup", "work-learning"]);
  assert.deepEqual(sorted(branch.directIds), ["checkup", "work"]);
});

test("a shared project does not pull in sibling topics when selecting a topic", () => {
  const branch = selectionBranch(data, "learning");
  assert.ok(!branch.nodeIds.has("other-topic"));
  assert.ok(!branch.edgeIds.has("other-topic-navigator"));
});

test("project selection follows all existing inward paths, excluding unrelated sibling projects", () => {
  const branch = selectionBranch(data, "navigator");
  assert.deepEqual(sorted(branch.nodeIds), ["checkup", "learning", "navigator", "other-topic", "work"]);
  assert.deepEqual(sorted(branch.edgeIds), ["checkup-navigator", "learning-checkup", "other-topic-navigator", "work-learning", "work-other-topic"]);
  assert.ok(!branch.nodeIds.has("oceans"));
});

test("methodology selection preserves direct semantic peers without recursively flooding other branches", () => {
  const branch = selectionBranch(data, "checkup");
  assert.deepEqual(sorted(branch.nodeIds), ["checkup", "learning", "navigator", "peer", "work"]);
  assert.ok(branch.edgeIds.has("checkup-peer"));
  assert.ok(!branch.nodeIds.has("distant-peer"));
});

test("missing selections, disconnected records, dangling edges and cycles are handled safely", () => {
  assert.equal(selectionBranch(data).nodeIds.size, 0);
  assert.equal(selectionBranch(data, "missing").nodeIds.size, 0);
  assert.deepEqual(sorted(selectionBranch(data, "unlinked").nodeIds), ["unlinked"]);
  const malformed = { ...data, edges: [...data.edges,
    edge("production", "missing", "topic-project"), edge("production", "music", "interest-area-topic"),
  ] };
  const branch = selectionBranch(malformed, "music");
  assert.deepEqual(sorted(branch.nodeIds), ["choirs", "music", "oceans", "production"]);
  assert.ok(!branch.edgeIds.has("production-missing"));
});

test("semantic edges within a branch are independent of API edge order", () => {
  const graph = { ...data, edges: [...data.edges, edge("checkup", "distant-peer", "methodology-relationship")] };
  const expected = selectionBranch(graph, "checkup");
  assert.ok(expected.edgeIds.has("peer-distant-peer"));
  const reversed = selectionBranch({ ...graph, edges: [...graph.edges].reverse() }, "checkup");
  assert.deepEqual(sorted(reversed.nodeIds), sorted(expected.nodeIds));
  assert.deepEqual(sorted(reversed.edgeIds), sorted(expected.edgeIds));
});
