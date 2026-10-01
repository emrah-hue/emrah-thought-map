export type NodeClass = "interest-area" | "topic" | "methodology" | "project";
export type Relation =
  | "interest-area-topic"
  | "topic-methodology"
  | "topic-project"
  | "methodology-project"
  | "methodology-relationship";
export type MethodologyRelationType = "Besler" | "Kapsar" | "Tamamlar" | "Derinleştirir";
export type GraphFilter = "all" | "interest-areas" | "topics" | "methodologies" | "projects";

type BaseEntity = { id: string; title: string; summary: string; hidden?: boolean };
export type InterestArea = BaseEntity & { topicIds: string[] };
export type Topic = BaseEntity & { interestAreaIds: string[]; methodologyIds: string[]; projectIds: string[] };
export type Methodology = BaseEntity & { stage: string; topicIds: string[]; projectIds: string[]; source?: string };
export type Project = BaseEntity & { type?: string; status?: string; topicIds: string[]; methodologyIds: string[] };
export type MethodologyRelationship = {
  id: string;
  sourceMethodologyId: string;
  targetMethodologyId: string;
  relationType: MethodologyRelationType;
  description?: string;
};
export type NormalizedSecondBrain = {
  interestAreas: InterestArea[];
  topics: Topic[];
  methodologies: Methodology[];
  projects: Project[];
  methodologyRelationships: MethodologyRelationship[];
};

export type PublicGraphNode = {
  id: string;
  label: string;
  nodeClass: NodeClass;
  summary: string;
  size: number;
  stage?: string;
  source?: string;
  projectType?: string;
  status?: string;
};
export type PublicGraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: Relation;
  relationType?: MethodologyRelationType;
  description?: string;
};
export type PublicGraph = { nodes: PublicGraphNode[]; edges: PublicGraphEdge[]; generatedAt: string };
