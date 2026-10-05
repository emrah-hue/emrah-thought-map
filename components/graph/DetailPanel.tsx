"use client";
import type { NodeClass, PublicGraphNode } from "@/lib/graph/types";

const LABELS: Record<NodeClass, string> = { "interest-area": "İLGİ ALANI", topic: "KONU", methodology: "METODOLOJİ", project: "PROJE" };
const RELATED_LABELS: Record<NodeClass, string> = { "interest-area": "İlgi Alanları", topic: "Konular", methodology: "Metodolojiler", project: "Projeler" };

export function MapFootnote({className=""}:{className?:string}){
 return <footer className={`map-footnote ${className}`}><p>Bu harita, deneysel ve interaktif bir CV deneyimidir.</p><a href="https://www.consciousbusinessturkey.com" target="_blank" rel="noopener noreferrer">www.consciousbusinessturkey.com <span aria-hidden="true">↗</span></a></footer>;
}

export function DetailPanel({node,neighbors,onSelect,onClose}:{node?:PublicGraphNode;neighbors:PublicGraphNode[];onSelect:(id:string)=>void;onClose:()=>void}){
 if(!node)return <aside className="panel panel-empty" aria-label="Detay paneli"><div><span className="panel-number">KEŞFET</span><h2>Bağlantıları takip edin.</h2><p className="summary">Bir düğümü seçerek özetini ve doğrudan ilişkili kayıtları görün.</p></div><p className="hint">Yakınlaştırmak için kaydırın · Taşımak için düğümü sürükleyin</p><MapFootnote/></aside>;
 const groups=(["interest-area","topic","methodology","project"] as NodeClass[]).map(nodeClass=>({nodeClass,items:neighbors.filter(n=>n.nodeClass===nodeClass)}));
 const list=(title:string,items:PublicGraphNode[])=><section className="related"><h3>{title}</h3>{items.map(n=><button key={n.id} onClick={()=>onSelect(n.id)}>{n.label} <span aria-hidden="true">↗</span></button>)}</section>;
 const meta=[node.nodeClass==="project"?node.projectType:undefined,node.status,node.stage].filter(Boolean);
 return <aside className="panel" aria-label={`${node.label} ayrıntıları`}><button className="close" onClick={onClose} aria-label="Paneli kapat">×</button><span className="panel-number">{LABELS[node.nodeClass]}</span><h2>{node.label}</h2>{meta.length>0&&<div className="panel-meta">{meta.map(value=><span key={value}>{value}</span>)}</div>}<p className="summary">{node.summary||"Bu kayıt için henüz bir özet eklenmedi."}</p>{groups.filter(group=>group.items.length>0).map(group=><div key={group.nodeClass}>{list(RELATED_LABELS[group.nodeClass],group.items)}</div>)}<p className="hint">Haritada ilerlemek için ilişkili bir kayıt seçin.</p><MapFootnote/></aside>
}
