"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GraphFilter, PublicGraph } from "@/lib/graph/types";
import { DetailPanel, MapFootnote } from "./DetailPanel";
import { GraphFilters } from "./GraphFilters";
import { Search } from "./Search";
import type { GraphCanvasHandle } from "./GraphCanvas";

const GraphCanvas = dynamic(() => import("./GraphCanvas").then(module => module.GraphCanvas), { ssr: false });

export function ThoughtMap({ data }: { data: PublicGraph }) {
  const [graph, setGraph] = useState(data);
  const [selected, setSelected] = useState<string>();
  const [filter, setFilter] = useState<GraphFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");
  const refreshInFlight = useRef(false);
  const graphRef = useRef<GraphCanvasHandle | null>(null);
  const select = useCallback((id?: string) => {
    setSelected(id);
    if (id) requestAnimationFrame(() => graphRef.current?.focus(id));
  }, []);
  const node = graph.nodes.find(n => n.id === selected);
  const neighbors = useMemo(() => selected ? graph.edges
    .filter(e => e.source === selected || e.target === selected)
    .map(e => graph.nodes.find(n => n.id === (e.source === selected ? e.target : e.source)))
    .filter(n => n !== undefined) : [], [graph, selected]);

  async function refreshGraph() {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    setRefreshStatus("");
    try {
      const response = await fetch("/api/refresh-graph", {
        method: "POST",
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error("Graph refresh failed");
      const refreshed: PublicGraph = await response.json();
      setGraph(current => current.generatedAt === refreshed.generatedAt ? current : refreshed);
      setSelected(current => refreshed.nodes.some(n => n.id === current) ? current : undefined);
      setRefreshStatus("Harita güncellendi.");
    } catch {
      setRefreshStatus("Güncellenemedi. Mevcut harita korunuyor; tekrar deneyebilirsiniz.");
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }

  return <div className="shell" data-selected={Boolean(node)}>
    <section className="graph-stage">
      <header className="masthead">
        <p className="eyebrow">EMRAH AKBALABAN’IN DÜŞÜNCE HARİTASI</p>
        <h1>Fikirlerin yaşayan bir ağ diyagramı…</h1>
        <p>İlgi alanlarımı, çalıştığım konuları, metodolojilerimi ve projelerimi birbirine bağlayan, sürekli güncel tuttuğum kişisel düşünce haritam.</p>
      </header>
      <div className="legend" aria-hidden="true"><span><i /> İlgi Alanı</span><span><i /> Konu</span><span><i /> Metodoloji</span><span><i /> Proje</span></div>
      <GraphCanvas data={graph} selected={selected} filter={filter} onSelect={select} handleRef={graphRef} />
      <div className="zoom-controls" role="group" aria-label="Harita görünümü">
        <button onClick={() => graphRef.current?.zoomIn()} aria-label="Haritayı yakınlaştır">+</button>
        <button onClick={() => graphRef.current?.zoomOut()} aria-label="Haritayı uzaklaştır">−</button>
        <button onClick={() => graphRef.current?.resetView()} aria-label="Haritanın tamamını göster">⤢</button>
      </div>
      <div className="toolbar">
        <Search nodes={graph.nodes} onSelect={select} />
        <GraphFilters value={filter} onChange={value => { setFilter(value); setSelected(undefined); }} />
        <div className="refresh-control">
          <button className="refresh-button" onClick={refreshGraph} disabled={refreshing} aria-busy={refreshing} aria-label={refreshing ? "Harita güncelleniyor" : "Haritayı güncelle"} title="Güncel veriyi getirir. Tekrarlanan istekler bir dakika boyunca aynı veriyi paylaşır.">
            <span aria-hidden="true">↻</span> <span className="refresh-label">{refreshing ? "Güncelleniyor…" : "Haritayı güncelle"}</span>
          </button>
          <p className="refresh-status" role="status">{refreshStatus}</p>
        </div>
        <MapFootnote className="map-footnote-mobile" />
      </div>
    </section>
    <DetailPanel node={node} neighbors={neighbors} onSelect={select} onClose={() => select(undefined)} />
  </div>;
}
