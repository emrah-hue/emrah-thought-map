"use client";
import type { GraphFilter } from "@/lib/graph/types";
const options:[GraphFilter,string][]=[["all","Tümü"],["topics","Konular"],["methods","Metodolojiler / Modeller"],["current","Gündemde"]];
export function GraphFilters({value,onChange}:{value:GraphFilter;onChange:(v:GraphFilter)=>void}){
 return <nav className="filters" aria-label="Ağ filtreleri">{options.map(([key,label])=><button key={key} className={value===key?"active":""} aria-pressed={value===key} onClick={()=>onChange(key)}>{label}</button>)}</nav>
}
