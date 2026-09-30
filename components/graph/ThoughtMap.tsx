"use client";
import { useCallback,useMemo,useRef,useState } from "react";
import dynamic from "next/dynamic";
import type { GraphFilter,PublicGraph } from "@/lib/graph/types";
import { DetailPanel } from "./DetailPanel";import { GraphFilters } from "./GraphFilters";import { Search } from "./Search";import type { GraphCanvasHandle } from "./GraphCanvas";

const GraphCanvas=dynamic(()=>import("./GraphCanvas").then(module=>module.GraphCanvas),{ssr:false});
export function ThoughtMap({data}:{data:PublicGraph}){
 const [selected,setSelected]=useState<string>();const [filter,setFilter]=useState<GraphFilter>("all");const graphRef=useRef<GraphCanvasHandle|null>(null);
 const select=useCallback((id?:string)=>{setSelected(id);if(id)requestAnimationFrame(()=>graphRef.current?.focus(id))},[]);
 const node=data.nodes.find(n=>n.id===selected);const neighbors=useMemo(()=>selected?data.edges.filter(e=>e.source===selected||e.target===selected).map(e=>data.nodes.find(n=>n.id===(e.source===selected?e.target:e.source))).filter(n=>n!==undefined):[],[data,selected]);
 return <div className="shell"><section className="graph-stage"><header className="masthead"><p className="eyebrow">Düşünce Haritası / 01</p><h1>Fikirler, aralarındaki bağlarda yaşar.</h1><p>Kavramları, modelleri ve gelişmekte olan düşünceleri keşfedin.</p></header><div className="legend" aria-hidden="true"><span><i/> Konu</span><span><i/> Bilgi</span></div><GraphCanvas data={data} selected={selected} filter={filter} onSelect={select} handleRef={graphRef}/><div className="toolbar"><Search nodes={data.nodes} onSelect={select}/><GraphFilters value={filter} onChange={v=>{setFilter(v);setSelected(undefined)}}/></div></section><DetailPanel node={node} neighbors={neighbors} onSelect={select} onClose={()=>select(undefined)}/></div>
}
