"use client";
import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import type { NodeLabelDrawingFunction, NodeHoverDrawingFunction } from "sigma/rendering";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphFilter, PublicGraph, PublicGraphNode } from "@/lib/graph/types";
import { matchesFilter } from "@/lib/graph/filters";
import { NODE_COLOR, PAPER_COLOR, paperBlend } from "@/lib/graph/visual-rules";

// Sigma's label grid still decides which labels appear. A paper outline keeps
// them readable over edges; long overview labels reveal their full text on hover.
const drawLabel: NodeLabelDrawingFunction = (context, data, settings) => {
  if (!data.label) return;
  context.save();
  const weight = data.highlighted ? "600" : settings.labelWeight;
  context.font = `${weight} ${settings.labelSize}px ${settings.labelFont}, sans-serif`;
  let label = data.label;
  const maxWidth = data.highlighted ? 260 : 180;
  if (context.measureText(label).width > maxWidth && !data.highlighted) {
    while (label.length > 1 && context.measureText(`${label}…`).width > maxWidth) label = label.slice(0, -1);
    label += "…";
  }
  const x = data.x + data.size + 7;
  const y = data.y + settings.labelSize / 3;
  context.lineWidth = 4;
  context.lineJoin = "round";
  context.strokeStyle = PAPER_COLOR;
  context.strokeText(label, x, y);
  context.fillStyle = "#30352f";
  context.fillText(label, x, y);
  context.restore();
};

const drawHover: NodeHoverDrawingFunction = (context, data, settings) => {
  context.save();
  context.beginPath();
  context.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2);
  context.fillStyle = PAPER_COLOR;
  context.fill();
  context.strokeStyle = data.color;
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
  drawLabel(context, { ...data, highlighted: true }, settings);
};

export type GraphCanvasHandle = { focus: (id: string) => void; refresh: () => void };
export function GraphCanvas({ data, selected, filter, onSelect, handleRef }: {
  data: PublicGraph;
  selected?: string;
  filter: GraphFilter;
  onSelect: (id?: string) => void;
  handleRef: React.MutableRefObject<GraphCanvasHandle | null>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const state = useRef({ selected, filter });
  state.current = { selected, filter };
  useEffect(() => {
    if (!container.current) return;
    const graph = new Graph({ multi: false, type: "directed" });
    const initialRadius = data.nodes.reduce((radius, node) => Math.max(radius, node.size * 3), 1);
    data.nodes.forEach((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      graph.addNode(n.id, {
        ...n, x: Math.cos(angle) * initialRadius, y: Math.sin(angle) * initialRadius,
        color: NODE_COLOR[n.nodeClass], label: n.label, size: n.size,
      });
    });
    data.edges.forEach(e => {
      const semantic = e.relation === "methodology-relationship";
      const hierarchy = e.relation === "interest-area-topic";
      graph.addEdgeWithKey(e.id, e.source, e.target, {
        ...e,
        color: paperBlend(semantic ? NODE_COLOR.methodology : "#647265", semantic ? .4 : hierarchy ? .32 : .22),
        size: semantic ? 1.05 : hierarchy ? .8 : .55,
      });
    });
    const renderer = new Sigma(graph, container.current, {
      renderEdgeLabels: false,
      labelFont: "DM Sans", labelWeight: "500", labelSize: 12,
      labelColor: { color: "#30352f" },
      labelDensity: .7, labelGridCellSize: 120, labelRenderedSizeThreshold: 8,
      defaultDrawNodeLabel: drawLabel, defaultDrawNodeHover: drawHover,
      defaultEdgeType: "line", minEdgeThickness: .3, stagePadding: 50, zIndex: true,
      nodeReducer: (id, attrs) => {
        const { selected, filter } = state.current;
        if (!matchesFilter(attrs as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        if (!selected || !graph.hasNode(selected)) return attrs;
        const active = id === selected;
        const near = active || graph.areNeighbors(id, selected);
        return {
          ...attrs,
          color: near ? attrs.color : paperBlend(attrs.color, .22),
          label: near ? attrs.label : "",
          highlighted: active, forceLabel: active,
          zIndex: active ? 3 : near ? 2 : 0,
          size: attrs.size * (active ? 1.2 : near ? 1.06 : .92),
        };
      },
      edgeReducer: (id, attrs) => {
        const { selected, filter } = state.current;
        const [s, t] = graph.extremities(id);
        if (!matchesFilter(graph.getNodeAttributes(s) as PublicGraphNode, filter) ||
            !matchesFilter(graph.getNodeAttributes(t) as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        if (!selected || !graph.hasNode(selected)) return attrs;
        const relevant = s === selected || t === selected;
        return {
          ...attrs,
          color: relevant ? paperBlend(graph.getNodeAttribute(selected, "color"), .65) : paperBlend("#647265", .09),
          size: relevant ? attrs.size + .85 : .3,
          zIndex: relevant ? 2 : 0,
        };
      },
    });
    handleRef.current = {
      focus: (id) => {
        if (!graph.hasNode(id)) return;
        const pos = renderer.getNodeDisplayData(id);
        if (pos) renderer.getCamera().animate({ x: pos.x, y: pos.y, ratio: Math.min(renderer.getCamera().ratio, .55) }, { duration: 600 });
      },
      refresh: () => renderer.refresh(),
    };
    let dragged: string | null = null, isDragging = false;
    renderer.on("downNode", ({ node }) => { dragged = node; isDragging = false; renderer.getCamera().disable(); });
    renderer.getMouseCaptor().on("mousemovebody", e => {
      if (!dragged) return;
      isDragging = true;
      const pos = renderer.viewportToGraph(e);
      graph.setNodeAttribute(dragged, "x", pos.x);
      graph.setNodeAttribute(dragged, "y", pos.y);
      e.preventSigmaDefault();
      e.original.preventDefault();
    });
    renderer.getMouseCaptor().on("mouseup", () => { dragged = null; renderer.getCamera().enable(); });
    renderer.getMouseCaptor().on("mouseleave", () => { dragged = null; renderer.getCamera().enable(); });
    renderer.on("clickNode", ({ node }) => { if (!isDragging) onSelect(node); });
    renderer.on("clickStage", () => onSelect(undefined));
    const observer = new ResizeObserver(() => renderer.resize());
    observer.observe(container.current);
    const settings = forceAtlas2.inferSettings(graph);
    const layout = new FA2Layout(graph, { settings: { ...settings, adjustSizes: true, gravity: 1.1, scalingRatio: 7, slowDown: 3 } });
    layout.start();
    const stop = window.setTimeout(() => { layout.stop(); renderer.getCamera().animatedReset({ duration: 650 }); }, 1800);
    return () => { clearTimeout(stop); layout.kill(); observer.disconnect(); renderer.kill(); handleRef.current = null; };
  }, [data, onSelect, handleRef]);
  useEffect(() => { handleRef.current?.refresh(); }, [filter, selected, handleRef]);
  return <div ref={container} className="graph-canvas" role="img" aria-label="İlgi alanları, konular, metodolojiler ve projeler arasındaki etkileşimli düşünce haritası" />;
}
