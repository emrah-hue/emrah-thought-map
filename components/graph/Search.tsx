"use client";
import { useMemo,useState } from "react";
import type { PublicGraphNode } from "@/lib/graph/types";
export function Search({nodes,onSelect}:{nodes:PublicGraphNode[];onSelect:(id:string)=>void}){
 const [query,setQuery]=useState("");
 const results=useMemo(()=>{const q=query.trim().toLocaleLowerCase("tr-TR");return q?nodes.filter(n=>n.label.toLocaleLowerCase("tr-TR").includes(q)).slice(0,7):[]},[nodes,query]);
 return <div className="search-wrap"><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ağda ara…" aria-label="Düşünce ağında ara" />{results.length>0&&<ul className="results" aria-label="Arama sonuçları">{results.map(n=><li key={n.id}><button onClick={()=>{onSelect(n.id);setQuery("")}}>{n.label}</button></li>)}</ul>}</div>
}
