import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicGraph } from "./build-public-graph";
import type { NormalizedSecondBrain } from "./types";
import { selectionBranch } from "./selection-branch";
import { focusLayout } from "./focus-layout";

const empty: NormalizedSecondBrain = { interestAreas: [], topics: [], methodologies: [], projects: [], methodologyRelationships: [] };

test("peer relations are reciprocal, deduplicated and reachable from either endpoint", () => {
  const topic = { title: "Topic", summary: "", interestAreaIds: [], methodologyIds: [], projectIds: [] };
  const project = { title: "Project", summary: "", topicIds: [], methodologyIds: [] };
  const source: NormalizedSecondBrain = { ...empty,
    topics: [{ ...topic, id: "b", relatedTopicIds: ["a", "a"] }, { ...topic, id: "a", relatedTopicIds: ["b"] }],
    projects: [{ ...project, id: "q", relatedProjectIds: ["p"] }, { ...project, id: "p", relatedProjectIds: ["q"] }],
  };
  const graph = buildPublicGraph(source);
  assert.deepEqual(graph.edges.map(e => [e.relation, e.source, e.target]), [
    ["topic-relationship", "a", "b"], ["project-relationship", "p", "q"],
  ]);
  for (const [a, b, filter] of [["a", "b", "topics"], ["p", "q", "projects"]] as const) {
    assert.deepEqual([...selectionBranch(graph, a).directIds], [b]);
    assert.deepEqual([...selectionBranch(graph, b).directIds], [a]);
    const layout = focusLayout(graph, filter, a);
    assert.deepEqual(layout.positions.get(a), { x: 0, y: 0 });
    const peer = layout.positions.get(b)!;
    assert.ok(Math.hypot(peer.x, peer.y) >= 180);
  }
  const oneSided = structuredClone(source);
  oneSided.topics[1].relatedTopicIds = [];
  oneSided.projects[1].relatedProjectIds = [];
  assert.deepEqual(buildPublicGraph(oneSided).edges, graph.edges);
});

test("peer relations reject hidden, missing, self and wrong-layer endpoints", () => {
  const topic = { title: "Topic", summary: "", interestAreaIds: [], methodologyIds: [], projectIds: [] };
  const project = { title: "Project", summary: "", topicIds: [], methodologyIds: [] };
  const graph = buildPublicGraph({ ...empty,
    topics: [{ ...topic, id: "a", relatedTopicIds: ["a", "secret-topic", "missing", "p"] }, { ...topic, id: "secret-topic", hidden: true, relatedTopicIds: ["a"] }],
    projects: [{ ...project, id: "p", relatedProjectIds: ["p", "secret-project", "missing", "a"] }, { ...project, id: "secret-project", hidden: true, relatedProjectIds: ["p"] }],
  });
  assert.equal(graph.edges.length, 0);
  assert.equal(JSON.stringify(graph).includes("secret"), false);
});

test("refresh rebuilds changed peer relations without retaining removed links", () => {
  const topic = { title: "Topic", summary: "", interestAreaIds: [], methodologyIds: [], projectIds: [] };
  const source: NormalizedSecondBrain = { ...empty, topics: [
    { ...topic, id: "a", relatedTopicIds: ["b"] }, { ...topic, id: "b" }, { ...topic, id: "c" },
  ] };
  assert.equal(buildPublicGraph(source).edges[0].target, "b");
  source.topics[0].relatedTopicIds = ["c"];
  assert.equal(buildPublicGraph(source).edges[0].target, "c");
  source.topics[0].relatedTopicIds = [];
  assert.equal(buildPublicGraph(source).edges.length, 0);
});

test("hidden records and archived methodologies never reach the public DTO", () => {
  const graph = buildPublicGraph({
    ...empty,
    topics: [{ id: "topic", title: "Public topic", summary: "", interestAreaIds: [], methodologyIds: ["archive"], projectIds: ["secret"] }],
    methodologies: [{ id: "archive", title: "Archived", summary: "", stage: "Arşiv", topicIds: ["topic"], projectIds: [] }],
    projects: [{ id: "secret", title: "Secret project", summary: "", hidden: true, topicIds: ["topic"], methodologyIds: [] }],
    methodologyRelationships: [{ id: "dangling", sourceMethodologyId: "archive", targetMethodologyId: "missing", relationType: "Besler" }],
  });
  assert.deepEqual(graph.nodes.map((node) => node.id), ["topic"]);
  assert.equal(graph.edges.length, 0);
  assert.equal(JSON.stringify(graph).includes("Secret project"), false);
});

test("missing hidden means public and canonical edges are deduplicated without dangling edges", () => {
  const graph = buildPublicGraph({
    interestAreas: [{ id: "area", title: "Area", summary: "", topicIds: ["topic"] }],
    topics: [{ id: "topic", title: "Topic", summary: "", interestAreaIds: ["area"], methodologyIds: ["method"], projectIds: ["project"] }],
    methodologies: [{ id: "method", title: "Method", summary: "", stage: "Aktif", topicIds: ["topic"], projectIds: ["project"] }],
    projects: [{ id: "project", title: "Project", summary: "", topicIds: ["topic"], methodologyIds: ["method"] }],
    methodologyRelationships: [{ id: "semantic", sourceMethodologyId: "method", targetMethodologyId: "missing", relationType: "Tamamlar" }],
  });
  assert.equal(graph.nodes.length, 4);
  assert.deepEqual(graph.edges.map((edge) => edge.relation).sort(), ["interest-area-topic", "methodology-project", "topic-methodology", "topic-project"]);
  assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, graph.edges.length);
  assert.ok(graph.edges.every((edge) => graph.nodes.some((node) => node.id === edge.source) && graph.nodes.some((node) => node.id === edge.target)));
});

test("deduplicates nodes and keeps directed methodology relationship metadata", () => {
  const method = { id: "a", title: "A", summary: "", stage: "Aktif", topicIds: [], projectIds: [] };
  const graph = buildPublicGraph({ ...empty, methodologies: [method, method, { ...method, id: "b", title: "B" }], methodologyRelationships: [
    { id: "first", sourceMethodologyId: "a", targetMethodologyId: "b", relationType: "Derinleştirir", description: "Açıklama" },
    { id: "duplicate", sourceMethodologyId: "a", targetMethodologyId: "b", relationType: "Derinleştirir" },
  ] });
  assert.equal(graph.nodes.length, 2);
  assert.deepEqual(graph.edges, [{ id: "methodology-relationship:a:b:Derinleştirir", source: "a", target: "b", relation: "methodology-relationship", relationType: "Derinleştirir", description: "Açıklama" }]);
});
