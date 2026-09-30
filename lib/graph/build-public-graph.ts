import type { PublicGraph, PublicGraphEdge, SourceNode } from "./types";
import { nodeSize } from "./visual-rules";

const PUBLIC="Kamusal";
export function buildPublicGraph(source:SourceNode[]):PublicGraph {
  const publicNodes=source.filter(n=>n.visibility===PUBLIC && n.stage!=="Arşiv");
  const ids=new Set(publicNodes.map(n=>n.id));
  const edges:PublicGraphEdge[]=[]; const seen=new Set<string>();
  const add=(source:string,target:string,relation:"topic"|"related")=>{
    if(source===target || !ids.has(target)) return;
    const pair=relation==="related"?[source,target].sort().join("|"):`${source}|${target}`;
    const key=`${relation}|${pair}`; if(seen.has(key)) return; seen.add(key);
    edges.push({id:key,source,target,relation});
  };
  for(const node of publicNodes) {
    if(node.nodeClass!=="knowledge") continue;
    node.topicIds?.forEach(id=>add(node.id,id,"topic"));
    node.relatedIds?.forEach(id=>add(node.id,id,"related"));
  }
  const degree=new Map<string,number>();
  edges.forEach(e=>{degree.set(e.source,(degree.get(e.source)??0)+1);degree.set(e.target,(degree.get(e.target)??0)+1)});
  const nodes=publicNodes.map(node=>({
    id:node.id,label:node.label,nodeClass:node.nodeClass,subtype:node.subtype,summary:node.summary,
    stage:node.stage,weight:node.weight,resourceCount:node.resourceCount,resources:node.resources,
    size:nodeSize(node.nodeClass,node.weight,node.stage,degree.get(node.id)??0),
  }));
  return {nodes,edges,generatedAt:new Date().toISOString()};
}
