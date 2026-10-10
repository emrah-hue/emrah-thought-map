"use client";
import { useEffect, useMemo, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { animateNodes } from "sigma/utils";
import type { NodeLabelDrawingFunction, NodeHoverDrawingFunction } from "sigma/rendering";
import type { GraphFilter, PublicGraph, PublicGraphNode } from "@/lib/graph/types";
import { matchesFilter } from "@/lib/graph/filters";
import { NODE_COLOR, PAPER_COLOR, paperBlend } from "@/lib/graph/visual-rules";
import { circularLayout } from "@/lib/graph/circular-layout";
import { focusLayout } from "@/lib/graph/focus-layout";
import { selectionBranch } from "@/lib/graph/selection-branch";

type LabelBounds = { left: number; right: number; top: number; bottom: number };
const labelBounds = new WeakMap<CanvasRenderingContext2D, LabelBounds[]>();

// Sigma's label grid still decides which labels appear. A paper outline keeps
// them readable over edges; long overview labels reveal their full text on hover.
const drawLabel: NodeLabelDrawingFunction = (context, data, settings) => {
  if (!data.label) return;
  context.save();
  const weight = data.highlighted ? "600" : settings.labelWeight;
  context.font = `${weight} ${settings.labelSize}px ${settings.labelFont}, sans-serif`;
  if (data.focusLabel) {
    const width = data.highlighted ? 190 : 120;
    const words = data.label.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && context.measureText(next).width > width) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    const maxLines = data.highlighted ? 4 : 2;
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] += "…";
    }
    const lineHeight = settings.labelSize * 1.25;
    const above = data.highlighted || data.focusLabelAbove;
    const y = above ? data.y - data.size - 9 - (lines.length - 1) * lineHeight : data.y + data.size + lineHeight;
    const textWidth = Math.max(...lines.map(text => context.measureText(text).width));
    const bounds = { left: data.x - textWidth / 2 - 5, right: data.x + textWidth / 2 + 5, top: y - settings.labelSize - 4, bottom: y + (lines.length - 1) * lineHeight + 4 };
    const occupied = labelBounds.get(context) ?? [];
    if (!data.highlighted && occupied.some(b => bounds.left < b.right && bounds.right > b.left && bounds.top < b.bottom && bounds.bottom > b.top)) {
      context.restore();
      return;
    }
    occupied.push(bounds);
    labelBounds.set(context, occupied);
    context.textAlign = "center";
    context.lineWidth = 4;
    context.lineJoin = "round";
    context.strokeStyle = PAPER_COLOR;
    context.fillStyle = "#30352f";
    lines.forEach((text, i) => { context.strokeText(text, data.x, y + i * lineHeight); context.fillText(text, data.x, y + i * lineHeight); });
    context.restore();
    return;
  }
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

export type GraphCanvasHandle = {
  refresh: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  layout: (filter: GraphFilter, selected?: string) => void;
};
export function GraphCanvas({ data, selected, filter, onSelect, handleRef }: {
  data: PublicGraph;
  selected?: string;
  filter: GraphFilter;
  onSelect: (id?: string) => void;
  handleRef: React.MutableRefObject<GraphCanvasHandle | null>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const branch = useMemo(() => selectionBranch(data, selected), [data, selected]);
  const state = useRef({ selected, filter, branch });
  state.current = { selected, filter, branch };
  useEffect(() => {
    if (!container.current) return;
    const graph = new Graph({ multi: false, type: "directed" });
    const initial = circularLayout(data, "all");
    let currentLayout = initial;
    let sizeScale = 1;
    let cancelLayoutAnimation: (() => void) | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    data.nodes.forEach(n => {
      graph.addNode(n.id, {
        ...n, ...initial.positions.get(n.id),
        color: NODE_COLOR[n.nodeClass], label: n.label, size: n.size,
      });
    });
    data.edges.forEach(e => {
      const semantic = e.relation === "methodology-relationship" || e.relation === "topic-relationship" || e.relation === "project-relationship";
      const peerClass = e.relation === "topic-relationship" ? "topic" : e.relation === "project-relationship" ? "project" : "methodology";
      const hierarchy = e.relation === "interest-area-topic";
      graph.addEdgeWithKey(e.id, e.source, e.target, {
        ...e,
        color: paperBlend(semantic ? NODE_COLOR[peerClass] : "#647265", semantic ? .4 : hierarchy ? .32 : .22),
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
        const { selected, filter, branch } = state.current;
        if (!matchesFilter(attrs as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        const size = attrs.size * sizeScale;
        if (!selected || !graph.hasNode(selected)) return { ...attrs, size };
        const active = id === selected;
        const near = branch.nodeIds.has(id);
        return {
          ...attrs,
          color: near ? attrs.color : paperBlend(attrs.color, .12),
          label: near ? attrs.label : "",
          focusLabel: near,
          focusLabelAbove: near && attrs.y > 0,
          // Small neighborhoods show all labels; dense ones keep Sigma's grid.
          highlighted: active, forceLabel: active || (near && branch.nodeIds.size <= 8),
          zIndex: active ? 3 : near ? 2 : 0,
          size: size * (active ? 1.2 : near ? 1.06 : .65),
        };
      },
      edgeReducer: (id, attrs) => {
        const { selected, filter, branch } = state.current;
        const [s, t] = graph.extremities(id);
        if (!matchesFilter(graph.getNodeAttributes(s) as PublicGraphNode, filter) ||
            !matchesFilter(graph.getNodeAttributes(t) as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        if (!selected || !graph.hasNode(selected)) return attrs;
        if (!branch.edgeIds.has(id)) return { ...attrs, hidden: true };
        return {
          ...attrs,
          color: paperBlend(graph.getNodeAttribute(selected, "color"), .55),
          size: attrs.size + .6,
          zIndex: 2,
        };
      },
    });
    const overlays = container.current.parentElement?.querySelectorAll<HTMLElement>(".masthead, .legend, .toolbar, .zoom-controls");
    renderer.on("beforeRender", () => {
      // Focus labels also leave room for the fixed controls and introductory text.
      const viewport = container.current?.getBoundingClientRect();
      const reserved: LabelBounds[] = [];
      if (state.current.selected && viewport) overlays?.forEach(element => {
        const box = element.getBoundingClientRect();
        if (box.width && box.height) reserved.push({ left: box.left - viewport.left - 4, right: box.right - viewport.left + 4, top: box.top - viewport.top - 4, bottom: box.bottom - viewport.top + 4 });
      });
      for (const name of ["labels", "hovers"]) {
        const context = renderer.getCanvases()[name]?.getContext("2d");
        if (context) labelBounds.set(context, [...reserved]);
      }
    });
    const fitNodeSizes = () => {
      const { width, height } = renderer.getDimensions();
      const pixelsPerUnit = Math.max(1, Math.min(width, height) - 100) / (2 * currentLayout.radius);
      sizeScale = Math.min(1, currentLayout.sizeRatio * pixelsPerUnit * .8);
    };
    const applyLayout = (filter: GraphFilter, selected?: string) => {
      cancelLayoutAnimation?.();
      currentLayout = focusLayout(data, filter, selected);
      const r = currentLayout.radius;
      renderer.setCustomBBox({ x: [-r, r], y: [-r, r] });
      fitNodeSizes();
      const targets = Object.fromEntries(currentLayout.positions);
      if (reducedMotion.matches) {
        for (const [id, position] of currentLayout.positions) graph.mergeNodeAttributes(id, position);
      } else {
        cancelLayoutAnimation = animateNodes(graph, targets, { duration: 280, easing: "quadraticInOut" });
      }
      renderer.refresh();
      void renderer.getCamera().animatedReset({ duration: reducedMotion.matches ? 0 : 280 });
    };
    handleRef.current = {
      refresh: () => renderer.refresh(),
      zoomIn: () => { void renderer.getCamera().animatedZoom({ duration: 200 }); },
      zoomOut: () => { void renderer.getCamera().animatedUnzoom({ duration: 200 }); },
      resetView: () => {
        if (state.current.selected) onSelect(undefined);
        else void renderer.getCamera().animatedReset({ duration: reducedMotion.matches ? 0 : 300 });
      },
      layout: applyLayout,
    };
    let dragged: string | null = null, isDragging = false;
    renderer.on("downNode", ({ node, event }) => {
      isDragging = false;
      // TouchCaptor also emits downNode. Keep its camera enabled so node taps
      // and one/two-finger gestures continue to use Sigma's native navigation.
      if (!(event.original instanceof MouseEvent) || event.original.button !== 0) return;
      cancelLayoutAnimation?.();
      dragged = node;
      renderer.getCamera().disable();
    });
    renderer.getMouseCaptor().on("mousemovebody", e => {
      if (!dragged) return;
      isDragging = true;
      const pos = renderer.viewportToGraph(e);
      graph.setNodeAttribute(dragged, "x", pos.x);
      graph.setNodeAttribute(dragged, "y", pos.y);
      e.preventSigmaDefault();
      e.original.preventDefault();
    });
    const releaseDrag = () => { dragged = null; renderer.getCamera().enable(); };
    renderer.getMouseCaptor().on("mouseup", releaseDrag);
    renderer.getMouseCaptor().on("mouseleave", releaseDrag);
    window.addEventListener("blur", releaseDrag);
    renderer.on("clickNode", ({ node }) => { if (!isDragging) onSelect(node); });
    renderer.on("clickStage", () => onSelect(undefined));
    const observer = new ResizeObserver(() => { renderer.resize(); fitNodeSizes(); renderer.refresh(); });
    observer.observe(container.current);
    return () => { cancelLayoutAnimation?.(); window.removeEventListener("blur", releaseDrag); observer.disconnect(); renderer.kill(); handleRef.current = null; };
  }, [data, onSelect, handleRef]);
  useEffect(() => { handleRef.current?.layout(filter, selected); }, [data, filter, selected, handleRef]);
  return <div ref={container} className="graph-canvas" role="img" aria-label="İlgi alanları, konular, metodolojiler ve projeler arasındaki etkileşimli düşünce haritası" />;
}
