import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicGraph } from "./build-public-graph";
import type { SourceNode } from "./types";
test("private and archived records and their edges never reach DTO",()=>{
 const input:SourceNode[]=[
  {id:"a",label:"Public",nodeClass:"knowledge",subtype:"Kavram",summary:"",visibility:"Kamusal",relatedIds:["b","c","a"]},
  {id:"b",label:"Secret Project",nodeClass:"knowledge",subtype:"Kavram",summary:"",visibility:"Özel"},
  {id:"c",label:"Archive",nodeClass:"knowledge",subtype:"Kavram",summary:"",visibility:"Kamusal",stage:"Arşiv"},
 ]; const graph=buildPublicGraph(input);
 assert.deepEqual(graph.nodes.map(n=>n.id),["a"]); assert.equal(graph.edges.length,0); assert.equal(JSON.stringify(graph).includes("Secret Project"),false);
});
test("related edges are undirected duplicates and self edges are removed",()=>{
 const base={nodeClass:"knowledge" as const,subtype:"Model",summary:"",visibility:"Kamusal"};
 const graph=buildPublicGraph([{...base,id:"a",label:"A",relatedIds:["b"]},{...base,id:"b",label:"B",relatedIds:["a"]}]);
 assert.equal(graph.edges.length,1);
});
