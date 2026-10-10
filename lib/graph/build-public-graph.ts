import type { NormalizedSecondBrain, PublicGraph, PublicGraphEdge, PublicGraphNode, Relation } from "./types";
import { nodeSize } from "./visual-rules";

export function buildPublicGraph(source: NormalizedSecondBrain): PublicGraph {
  const nodes: PublicGraphNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (node: PublicGraphNode) => {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };

  source.interestAreas.filter((item) => !item.hidden).forEach((item) => addNode({
    id: item.id, label: item.title, summary: item.summary, nodeClass: "interest-area", size: nodeSize("interest-area"),
  }));
  source.topics.filter((item) => !item.hidden).forEach((item) => addNode({
    id: item.id, label: item.title, summary: item.summary, nodeClass: "topic", size: nodeSize("topic"),
  }));
  source.methodologies.filter((item) => !item.hidden && item.stage !== "Arşiv").forEach((item) => addNode({
    id: item.id, label: item.title, summary: item.summary, nodeClass: "methodology", size: nodeSize("methodology"), stage: item.stage, source: item.source,
  }));
  source.projects.filter((item) => !item.hidden).forEach((item) => addNode({
    id: item.id, label: item.title, summary: item.summary, nodeClass: "project", size: nodeSize("project"), projectType: item.type, status: item.status,
  }));

  const edges: PublicGraphEdge[] = [];
  const edgeIds = new Set<string>();
  const nodeClasses = new Map(nodes.map(node => [node.id, node.nodeClass]));
  const addEdge = (sourceId: string, targetId: string, relation: Relation, metadata: Partial<PublicGraphEdge> = {}) => {
    if (sourceId === targetId || !nodeIds.has(sourceId) || !nodeIds.has(targetId)) return;
    const id = `${relation}:${sourceId}:${targetId}${metadata.relationType ? `:${metadata.relationType}` : ""}`;
    if (edgeIds.has(id)) return;
    edgeIds.add(id);
    edges.push({ id, source: sourceId, target: targetId, relation, ...metadata });
  };

  // Peer relations are undirected. Either endpoint may maintain the Notion
  // relation; sort IDs so reciprocal entries always produce one stable edge.
  const addPeerEdge = (a: string, b: string, nodeClass: "topic" | "project", relation: Relation) => {
    if (nodeClasses.get(a) !== nodeClass || nodeClasses.get(b) !== nodeClass) return;
    const [sourceId, targetId] = [a, b].sort();
    addEdge(sourceId, targetId, relation);
  };

  for (const topic of source.topics) {
    topic.interestAreaIds.forEach((id) => addEdge(id, topic.id, "interest-area-topic"));
    topic.methodologyIds.forEach((id) => addEdge(topic.id, id, "topic-methodology"));
    topic.projectIds.forEach((id) => addEdge(topic.id, id, "topic-project"));
    topic.relatedTopicIds?.forEach(id => addPeerEdge(topic.id, id, "topic", "topic-relationship"));
  }
  // Relations may be maintained from either side in Notion; canonical edge direction remains layer-to-layer.
  for (const area of source.interestAreas) area.topicIds.forEach((id) => addEdge(area.id, id, "interest-area-topic"));
  for (const methodology of source.methodologies) {
    methodology.topicIds.forEach((id) => addEdge(id, methodology.id, "topic-methodology"));
    methodology.projectIds.forEach((id) => addEdge(methodology.id, id, "methodology-project"));
  }
  for (const project of source.projects) {
    project.topicIds.forEach((id) => addEdge(id, project.id, "topic-project"));
    project.methodologyIds.forEach((id) => addEdge(id, project.id, "methodology-project"));
    project.relatedProjectIds?.forEach(id => addPeerEdge(project.id, id, "project", "project-relationship"));
  }
  for (const relationship of source.methodologyRelationships) addEdge(
    relationship.sourceMethodologyId,
    relationship.targetMethodologyId,
    "methodology-relationship",
    { relationType: relationship.relationType, description: relationship.description },
  );

  return { nodes, edges, generatedAt: new Date().toISOString() };
}
