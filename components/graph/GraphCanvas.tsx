"use client";
import { useEffect, useMemo, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import type { NodeLabelDrawingFunction, NodeHoverDrawingFunction } from "sigma/rendering";
import type { GraphFilter, PublicGraph, PublicGraphNode } from "@/lib/graph/types";
import { matchesFilter } from "@/lib/graph/filters";
import { NODE_COLOR, PAPER_COLOR, paperBlend } from "@/lib/graph/visual-rules";
import { circularLayout } from "@/lib/graph/circular-layout";
import { selectionBranch } from "@/lib/graph/selection-branch";

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

export type GraphCanvasHandle = {
  focus: (id: string) => void;
  refresh: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  layout: (filter: GraphFilter) => void;
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
    data.nodes.forEach(n => {
      graph.addNode(n.id, {
        ...n, ...initial.positions.get(n.id),
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
        const { selected, filter, branch } = state.current;
        if (!matchesFilter(attrs as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        const size = attrs.size * sizeScale;
        if (!selected || !graph.hasNode(selected)) return { ...attrs, size };
        const active = id === selected;
        const near = branch.nodeIds.has(id);
        return {
          ...attrs,
          color: near ? attrs.color : paperBlend(attrs.color, .22),
          label: near ? attrs.label : "",
          // Small branches (e.g. Music and its projects) can show every label;
          // larger branches keep Sigma's collision-aware label grid.
          highlighted: active, forceLabel: active || (near && branch.nodeIds.size <= 8),
          zIndex: active ? 3 : near ? 2 : 0,
          size: size * (active ? 1.2 : near ? 1.06 : .92),
        };
      },
      edgeReducer: (id, attrs) => {
        const { selected, filter, branch } = state.current;
        const [s, t] = graph.extremities(id);
        if (!matchesFilter(graph.getNodeAttributes(s) as PublicGraphNode, filter) ||
            !matchesFilter(graph.getNodeAttributes(t) as PublicGraphNode, filter)) return { ...attrs, hidden: true };
        if (!selected || !graph.hasNode(selected)) return attrs;
        const relevant = branch.edgeIds.has(id);
        return {
          ...attrs,
          color: relevant ? paperBlend(graph.getNodeAttribute(selected, "color"), .65) : paperBlend("#647265", .09),
          size: relevant ? attrs.size + .85 : .3,
          zIndex: relevant ? 2 : 0,
        };
      },
    });
    const fitNodeSizes = () => {
      const { width, height } = renderer.getDimensions();
      const pixelsPerUnit = Math.max(1, Math.min(width, height) - 100) / (2 * currentLayout.radius);
      sizeScale = Math.min(1, currentLayout.sizeRatio * pixelsPerUnit * .8);
    };
    const applyLayout = (filter: GraphFilter) => {
      currentLayout = circularLayout(data, filter);
      for (const [id, position] of currentLayout.positions) graph.mergeNodeAttributes(id, position);
      const r = currentLayout.radius;
      renderer.setCustomBBox({ x: [-r, r], y: [-r, r] });
      fitNodeSizes();
      renderer.refresh();
      void renderer.getCamera().animatedReset({ duration: 350 });
    };
    handleRef.current = {
      focus: (id) => {
        if (!graph.hasNode(id)) return;
        const related = selectionBranch(data, id);
        const points = [...related.nodeIds]
          .filter(nodeId => matchesFilter(graph.getNodeAttributes(nodeId) as PublicGraphNode, state.current.filter))
          .map(nodeId => renderer.getNodeDisplayData(nodeId)).filter(point => point !== undefined);
        if (!points.length) return;
        const xs = points.map(point => point.x), ys = points.map(point => point.y);
        const left = Math.min(...xs), right = Math.max(...xs), bottom = Math.min(...ys), top = Math.max(...ys);
        void renderer.getCamera().animate({
          x: (left + right) / 2, y: (bottom + top) / 2,
          ratio: Math.max(.38, Math.max(right - left, top - bottom) * 1.2),
        }, { duration: 600 });
      },
      refresh: () => renderer.refresh(),
      zoomIn: () => { void renderer.getCamera().animatedZoom({ duration: 200 }); },
      zoomOut: () => { void renderer.getCamera().animatedUnzoom({ duration: 200 }); },
      resetView: () => { void renderer.getCamera().animatedReset({ duration: 300 }); },
      layout: applyLayout,
    };
    let dragged: string | null = null, isDragging = false;
    renderer.on("downNode", ({ node, event }) => {
      isDragging = false;
      // TouchCaptor also emits downNode. Keep its camera enabled so node taps
      // and one/two-finger gestures continue to use Sigma's native navigation.
      if (!(event.original instanceof MouseEvent) || event.original.button !== 0) return;
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
    return () => { window.removeEventListener("blur", releaseDrag); observer.disconnect(); renderer.kill(); handleRef.current = null; };
  }, [data, onSelect, handleRef]);
  useEffect(() => { handleRef.current?.layout(filter); }, [data, filter, handleRef]);
  useEffect(() => { handleRef.current?.refresh(); }, [filter, selected, handleRef]);
  return <div ref={container} className="graph-canvas" role="img" aria-label="İlgi alanları, konular, metodolojiler ve projeler arasındaki etkileşimli düşünce haritası" />;
}
