export type NodeClass = "topic" | "knowledge";
export type Relation = "topic" | "related";
export type GraphFilter = "all" | "topics" | "methods" | "current";

export type PublicResource = { id:string; title:string; type:"article"|"pdf"|"video"|"document"|"link"; url?:string; summary?:string };
export type PublicGraphNode = { id:string; label:string; nodeClass:NodeClass; subtype:string; summary:string; stage?:string; weight?:number; size:number; resourceCount?:number; resources?:PublicResource[] };
export type PublicGraphEdge = { id:string; source:string; target:string; relation:Relation };
export type PublicGraph = { nodes:PublicGraphNode[]; edges:PublicGraphEdge[]; generatedAt:string };

export type SourceNode = Omit<PublicGraphNode,"size"> & { visibility:string; topicIds?:string[]; relatedIds?:string[] };
