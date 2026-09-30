"use client";
import { useEffect,useRef,type MutableRefObject } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphFilter,PublicGraph } from "@/lib/graph/types";
import { matchesFilter } from "@/lib/graph/filters";

export type GraphCanvasHandle={focus:(id:string)=>void;refresh:()=>void};
export function GraphCanvas({data,selected,filter,onSelect,handleRef}:{data:PublicGraph;selected?:string;filter:GraphFilter;onSelect:(id?:string)=>void;handleRef:MutableRefObject<GraphCanvasHandle|null>}){
 const container=useRef<HTMLDivElement>(null);
 const state=useRef({selected,filter}); state.current={selected,filter};
 useEffect(()=>{
  if(!container.current)return;
  const graph=new Graph({multi:false,type:"undirected"});
  data.nodes.forEach((n,i)=>{const angle=(i/data.nodes.length)*Math.PI*2;graph.addNode(n.id,{...n,x:Math.cos(angle)+(i%3)*.08,y:Math.sin(angle)+(i%4)*.08,color:n.nodeClass==="topic"?"#68756a":"#a75b3e",label:n.label,size:n.size})});
  data.edges.forEach(e=>graph.addEdgeWithKey(e.id,e.source,e.target,{relation:e.relation,color:e.relation==="topic"?"#aaa99f":"#b9a89e",size:e.relation==="topic"?.7:1}));
  const renderer=new Sigma(graph,container.current,{renderEdgeLabels:false,labelFont:"DM Sans",labelWeight:"500",labelSize:11,labelColor:{color:"#343731"},defaultEdgeType:"line",zIndex:true,nodeReducer:(id,attrs)=>{const {selected,filter}=state.current;const visible=matchesFilter(attrs as never,filter);if(!visible)return {...attrs,hidden:true};if(!selected)return attrs;const near=id===selected||graph.areNeighbors(id,selected);return {...attrs,color:near?attrs.color:"#d4d1c8",label:near?attrs.label:"",zIndex:id===selected?3:near?2:0,size:id===selected?attrs.size*1.25:attrs.size};},edgeReducer:(id,attrs)=>{const {selected,filter}=state.current;const [s,t]=graph.extremities(id);if(!matchesFilter(graph.getNodeAttributes(s) as never,filter)||!matchesFilter(graph.getNodeAttributes(t) as never,filter))return {...attrs,hidden:true};if(!selected)return {...attrs,color:"#c1bfb6"};const relevant=s===selected||t===selected;return {...attrs,color:relevant?"#565d54":"#dcd9d1",size:relevant?1.8:.35,zIndex:relevant?2:0};}});
  handleRef.current={focus:(id)=>{if(!graph.hasNode(id))return;const pos=renderer.getNodeDisplayData(id);if(pos)renderer.getCamera().animate({x:pos.x,y:pos.y,ratio:Math.min(renderer.getCamera().ratio,.55)},{duration:600});},refresh:()=>renderer.refresh()};
  let dragged:string|null=null,isDragging=false;
  renderer.on("downNode",({node})=>{dragged=node;isDragging=false;renderer.getCamera().disable();});
  renderer.getMouseCaptor().on("mousemovebody",e=>{if(!dragged)return;isDragging=true;const pos=renderer.viewportToGraph(e);graph.setNodeAttribute(dragged,"x",pos.x);graph.setNodeAttribute(dragged,"y",pos.y);e.preventSigmaDefault();e.original.preventDefault();});
  renderer.getMouseCaptor().on("mouseup",()=>{dragged=null;renderer.getCamera().enable();});
  renderer.getMouseCaptor().on("mouseleave",()=>{dragged=null;renderer.getCamera().enable();});
  renderer.on("clickNode",({node})=>{if(!isDragging)onSelect(node)});renderer.on("clickStage",()=>onSelect(undefined));
  const observer=new ResizeObserver(()=>renderer.resize());observer.observe(container.current);
  const settings=forceAtlas2.inferSettings(graph);const layout=new FA2Layout(graph,{settings:{...settings,gravity:1.4,scalingRatio:5,slowDown:3}});layout.start();const stop=window.setTimeout(()=>{layout.stop();renderer.getCamera().animatedReset({duration:650})},1800);
  return()=>{clearTimeout(stop);layout.kill();observer.disconnect();renderer.kill();handleRef.current=null};
 },[data,onSelect,handleRef]);
 useEffect(()=>{handleRef.current?.refresh()},[filter,selected,handleRef]);
 return <div ref={container} className="graph-canvas" role="img" aria-label="Konular ve bilgi varlıkları arasındaki etkileşimli düşünce ağı" />;
}
