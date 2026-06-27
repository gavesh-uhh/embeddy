"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CircuitSchematic, SchematicComponent, SchematicConnection } from "@/lib/types";

interface Props {
  schematic?: CircuitSchematic;
  error?: string;
  onRetry?: () => void;
}

const COMPONENT_COLORS: Record<string, string> = {
  mcu: "#051329",
  sensor: "#051f0f",
  power: "#1f1c05",
  module: "#111827",
};

const CONNECTION_COLORS: Record<string, string> = {
  power: "#ef4444",
  ground: "#4b5563",
  data: "#00ff66",
  analog: "#00e5ff",
};

const COMPONENT_BORDER_COLORS: Record<string, string> = {
  mcu: "#00e5ff",
  sensor: "#00ff66",
  power: "#eab308",
  module: "#3b82f6",
};

function getCompDims(type: string, pinCount: number, maxLeftPinLen: number = 0, maxRightPinLen: number = 0) {
  let w = 120;
  if (type === "mcu") w = 180;
  else if (type === "power") w = 110;
  
  const leftLabelW = maxLeftPinLen > 0 ? maxLeftPinLen * 5.8 + 6 : 0;
  const rightLabelW = maxRightPinLen > 0 ? maxRightPinLen * 5.8 + 6 : 0;
  const neededWidth = leftLabelW + rightLabelW + 20;
  
  w = Math.max(w, Math.ceil(neededWidth));
  
  const h = Math.max(type === "mcu" ? 140 : 90, pinCount * 25 + 65);
  return { w, h };
}

function getComponentPins(comp: SchematicComponent, connections: SchematicConnection[], mcuX: number): { left: string[], right: string[] } {
  const pins = new Set<string>();
  connections.forEach(conn => {
    if (conn.from === comp.id && conn.fromPin) pins.add(conn.fromPin);
    if (conn.to === comp.id && conn.toPin) pins.add(conn.toPin);
  });

  const pinList = Array.from(pins).sort((a, b) => {
    const getWeight = (p: string) => {
      const name = p.toUpperCase();
      if (name.includes("3.3V") || name.includes("3V3") || name.includes("5V") || name.includes("VCC") || name.includes("VIN")) return 1;
      if (name.includes("GND") || name.includes("VSS")) return 10;
      if (name.includes("SDA") || name.includes("SCL") || name.includes("TX") || name.includes("RX")) return 3;
      return 5;
    };
    return getWeight(a) - getWeight(b);
  });

  const left: string[] = [];
  const right: string[] = [];

  if (comp.type === "mcu") {
    pinList.forEach(p => {
      const name = p.toUpperCase();
      if (name.includes("GND") || name.includes("VCC") || name.includes("3.3V") || name.includes("3V3") || name.includes("5V") || name.includes("VIN") || name.includes("EN") || name.includes("RST") || name.startsWith("A")) {
        left.push(p);
      } else {
        right.push(p);
      }
    });
    if (left.length === 0 && right.length > 0) {
      left.push(...right.splice(0, Math.ceil(right.length / 2)));
    } else if (right.length === 0 && left.length > 0) {
      right.push(...left.splice(Math.ceil(left.length / 2)));
    }
  } else {
    if (comp.x > mcuX) {
      left.push(...pinList);
    } else {
      right.push(...pinList);
    }
  }

  return { left, right };
}

function getConnectionPoint(comp: SchematicComponent, pinName: string | undefined, layout: { left: string[], right: string[] }) {
  const maxPins = Math.max(layout.left.length, layout.right.length);
  const maxLeftPinLen = Math.max(0, ...layout.left.map(p => p.length));
  const maxRightPinLen = Math.max(0, ...layout.right.map(p => p.length));
  const dims = getCompDims(comp.type, maxPins, maxLeftPinLen, maxRightPinLen);

  if (!pinName) {
    return { x: comp.x + dims.w / 2, y: comp.y + dims.h / 2 };
  }

  const leftIdx = layout.left.indexOf(pinName);
  if (leftIdx !== -1) {
    return {
      x: comp.x - 6,
      y: comp.y + 45 + leftIdx * 25
    };
  }

  const rightIdx = layout.right.indexOf(pinName);
  if (rightIdx !== -1) {
    return {
      x: comp.x + dims.w + 6,
      y: comp.y + 45 + rightIdx * 25
    };
  }

  return { x: comp.x + dims.w / 2, y: comp.y + dims.h / 2 };
}

function autoLayout(components: SchematicComponent[]): SchematicComponent[] {
  const COLS = 3;
  const COL_WIDTH = 220;
  const ROW_HEIGHT = 170;
  const MARGIN_X = 40;
  const MARGIN_Y = 40;

  return components.map((comp, i) => {
    const hasPosition = comp.x > 0 && comp.y > 0;
    if (hasPosition) return comp;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return { ...comp, x: MARGIN_X + col * COL_WIDTH, y: MARGIN_Y + row * ROW_HEIGHT };
  });
}

function resolveOverlaps(
  components: SchematicComponent[],
  compPinMap: Map<string, { left: string[], right: string[] }>
): SchematicComponent[] {
  const result = [...components];
  const getRect = (c: SchematicComponent) => {
    const layout = compPinMap.get(c.id) || { left: [], right: [] };
    const maxPins = Math.max(layout.left.length, layout.right.length);
    const maxLeftPinLen = Math.max(0, ...layout.left.map(p => p.length));
    const maxRightPinLen = Math.max(0, ...layout.right.map(p => p.length));
    const dims = getCompDims(c.type, maxPins, maxLeftPinLen, maxRightPinLen);
    return { x: c.x, y: c.y, w: dims.w, h: dims.h };
  };

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = getRect(result[i]);
      const b = getRect(result[j]);
      const overlapX = a.x + a.w + 20 > b.x && b.x + b.w + 20 > a.x;
      const overlapY = a.y + a.h + 20 > b.y && b.y + b.h + 20 > a.y;
      if (overlapX && overlapY) {
        result[j] = { ...result[j], x: result[j].x + a.w + 40, y: result[j].y };
      }
    }
  }
  return result;
}

function manhattanPath(x1: number, y1: number, x2: number, y2: number): number[] {
  const midX = (x1 + x2) / 2;
  return [x1, y1, midX, y1, midX, y2, x2, y2];
}

export default function CircuitRenderer({ schematic, error, onRetry }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setRenderKey] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Konva = useRef<any>(null);

  const initKonva = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!schematic || !canvasRef.current) return;

    const K = await import("konva");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Konva.current = K.default as any;

    const container = canvasRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    if (stageRef.current) {
      stageRef.current.destroy();
    }

    const stage = new K.default.Stage({ container, width, height });
    stageRef.current = stage;

    let scale = 1;
    stage.on("wheel", (e) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
      const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
      scale = Math.max(0.2, Math.min(5, newScale));
      stage.scale({ x: scale, y: scale });
      stage.position({ x: pointer.x - mousePointTo.x * scale, y: pointer.y - mousePointTo.y * scale });
    });

    stage.draggable(true);

    const layer = new K.default.Layer();

    const mcu = schematic.components.find(c => c.type === "mcu");
    const mcuX = mcu ? mcu.x : 200;
    const compPinMap = new Map<string, { left: string[], right: string[] }>();
    schematic.components.forEach(comp => {
      compPinMap.set(comp.id, getComponentPins(comp, schematic.connections, mcuX));
    });

    const laidOut = resolveOverlaps(autoLayout(schematic.components), compPinMap);
    const compMap = new Map(laidOut.map((c) => [c.id, c]));

    const connectionGroup = new K.default.Group();

    schematic.connections.forEach((conn) => {
      const fromComp = compMap.get(conn.from);
      const toComp = compMap.get(conn.to);
      if (!fromComp || !toComp) return;

      const fromLayout = compPinMap.get(conn.from) || { left: [], right: [] };
      const toLayout = compPinMap.get(conn.to) || { left: [], right: [] };

      const fp = getConnectionPoint(fromComp, conn.fromPin, fromLayout);
      const tp = getConnectionPoint(toComp, conn.toPin, toLayout);
      const pts = manhattanPath(fp.x, fp.y, tp.x, tp.y);
      const color = CONNECTION_COLORS[conn.signalType] || "#4b5563";

      const line = new K.default.Line({
        points: pts,
        stroke: color,
        strokeWidth: 1.5,
        opacity: 0.7,
        lineCap: "round",
        lineJoin: "round",
        dash: conn.signalType === "ground" ? [4, 3] : undefined,
        name: `conn_${conn.from}_${conn.to}`,
      });
      connectionGroup.add(line);

      if (conn.signalType === "data" || conn.signalType === "analog") {
        const arrowSize = 6;
        const isLeftPin = toLayout.left.includes(conn.toPin || "");
        const points = isLeftPin 
          ? [tp.x - 12, tp.y, tp.x, tp.y]
          : [tp.x + 12, tp.y, tp.x, tp.y];

        const arrow = new K.default.Arrow({
          points: points,
          pointerLength: arrowSize,
          pointerWidth: arrowSize,
          fill: color,
          stroke: color,
          strokeWidth: 1.5,
        });
        connectionGroup.add(arrow);
      }

      [fp, tp].forEach((pt) => {
        const dot = new K.default.Circle({
          x: pt.x, y: pt.y, radius: 2.5,
          fill: color,
        });
        connectionGroup.add(dot);
      });
    });

    layer.add(connectionGroup);

    laidOut.forEach((comp) => {
      const layout = compPinMap.get(comp.id) || { left: [], right: [] };
      const maxPins = Math.max(layout.left.length, layout.right.length);
      const maxLeftPinLen = Math.max(0, ...layout.left.map(p => p.length));
      const maxRightPinLen = Math.max(0, ...layout.right.map(p => p.length));
      const dims = getCompDims(comp.type, maxPins, maxLeftPinLen, maxRightPinLen);
      
      const bg = COMPONENT_COLORS[comp.type] || COMPONENT_COLORS.module;
      const border = COMPONENT_BORDER_COLORS[comp.type] || "#334155";

      const group = new K.default.Group({
        x: comp.x, y: comp.y,
        draggable: false,
        name: comp.id,
      });

      const rect = new K.default.Rect({
        width: dims.w, height: dims.h,
        fill: bg,
        stroke: border,
        strokeWidth: 1.5,
        cornerRadius: 6,
        shadowColor: "rgba(0,0,0,0.5)",
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 4 },
      });
      group.add(rect);

      const typeBar = new K.default.Rect({
        width: dims.w, height: 4,
        fill: border,
        cornerRadius: [6, 6, 0, 0],
      });
      group.add(typeBar);

      const typeLabel = new K.default.Text({
        y: 8,
        width: dims.w,
        text: comp.type.toUpperCase(),
        fontSize: 8,
        fontFamily: "JetBrains Mono, monospace",
        fill: border,
        align: "center",
        opacity: 0.8,
      });
      group.add(typeLabel);

      const nameLabel = new K.default.Text({
        y: 18,
        width: dims.w,
        text: comp.variant,
        fontSize: comp.type === "mcu" ? 11 : 10,
        fontFamily: "Outfit, sans-serif",
        fontStyle: "bold",
        fill: "#f8fafc",
        align: "center",
        padding: 4,
        wrap: "word",
      });
      group.add(nameLabel);

      const idLabel = new K.default.Text({
        y: dims.h - 16,
        width: dims.w,
        text: comp.id,
        fontSize: 8,
        fontFamily: "JetBrains Mono, monospace",
        fill: "#64748b",
        align: "center",
      });
      group.add(idLabel);

      layout.left.forEach((pin, idx) => {
        const y = 45 + idx * 25;
        
        const stub = new K.default.Line({
          points: [-6, y, 0, y],
          stroke: border,
          strokeWidth: 1.5,
        });

        const dot = new K.default.Circle({
          x: -6,
          y: y,
          radius: 2,
          fill: border,
        });

        const leftLabelW = maxLeftPinLen > 0 ? maxLeftPinLen * 5.8 : 50;

        const pinTxt = new K.default.Text({
          x: 6,
          y: y - 5,
          width: leftLabelW,
          text: pin,
          fontSize: 8,
          fontFamily: "JetBrains Mono, monospace",
          fill: "#f8fafc",
          opacity: 0.9,
        });

        group.add(stub, dot, pinTxt);
      });

      layout.right.forEach((pin, idx) => {
        const y = 45 + idx * 25;
        
        const stub = new K.default.Line({
          points: [dims.w, y, dims.w + 6, y],
          stroke: border,
          strokeWidth: 1.5,
        });

        const dot = new K.default.Circle({
          x: dims.w + 6,
          y: y,
          radius: 2,
          fill: border,
        });

        const rightLabelW = maxRightPinLen > 0 ? maxRightPinLen * 5.8 : 50;

        const pinTxt = new K.default.Text({
          x: dims.w - rightLabelW - 6,
          y: y - 5,
          width: rightLabelW,
          text: pin,
          fontSize: 8,
          fontFamily: "JetBrains Mono, monospace",
          fill: "#f8fafc",
          opacity: 0.9,
          align: "right",
        });

        group.add(stub, dot, pinTxt);
      });

      group.on("click", () => {
        const newSelected = selectedId === comp.id ? null : comp.id;
        setSelectedId(newSelected);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectionGroup.children.forEach((child: any) => {
          const name = child.name();
          if (newSelected && (name.includes(comp.id))) {
            child.opacity(1);
            if (child.strokeWidth) child.strokeWidth(2.5);
          } else if (newSelected) {
            child.opacity(0.15);
          } else {
            child.opacity(0.7);
          }
        });

        laidOut.forEach((c) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const grp = layer.findOne(`#${c.id}`) as any;
          if (grp) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r = grp.findOne("Rect") as any;
            if (r) {
              r.strokeWidth(newSelected === c.id ? 2.5 : 1.5);
              r.shadowBlur(newSelected === c.id ? 16 : 10);
            }
          }
        });

        layer.batchDraw();
      });

      group.id(comp.id);
      group.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
      group.on("mouseleave", () => { document.body.style.cursor = "default"; });

      layer.add(group);
    });

    stage.add(layer);
    layer.batchDraw();
    setRenderKey((k) => k + 1);
  }, [schematic, selectedId]);

  useEffect(() => {
    initKonva();
    return () => {
      if (stageRef.current) {
        stageRef.current.destroy();
        stageRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schematic]);

  const handleExport = () => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const oldScale = stage.scale();
    const oldPos = stage.position();
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    const layer = stage.getLayers()[0];
    if (!layer) return;
    const clientRect = layer.getClientRect();
    const padding = 30;
    const dataURL = stage.toDataURL({
      x: clientRect.x - padding,
      y: clientRect.y - padding,
      width: clientRect.width + padding * 2,
      height: clientRect.height + padding * 2,
      pixelRatio: 2
    });
    stage.scale(oldScale);
    stage.position(oldPos);
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "circuit-schematic.png";
    a.click();
  };

  if (error) {
    return (
      <div className="rounded border h-full flex flex-col" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="panel-header">Circuit Schematic</span>
        </div>
        <div className="p-4 flex-1">
          <div className="rounded p-3 text-sm" style={{ background: "#f8514920", color: "#f85149", border: "1px solid #f8514940" }}>
            {error}
          </div>
          {onRetry && (
            <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded text-xs"
              style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              ↺ Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!schematic) return (
    <div className="rounded border h-full flex flex-col" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="panel-header">Circuit Schematic</span>
      </div>
      <div className="flex-1 p-4">
        <div className="skeleton h-full rounded" style={{ minHeight: "300px" }} />
      </div>
    </div>
  );

  return (
    <div className="rounded border h-full flex flex-col overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="panel-header">Circuit Schematic</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {schematic.components.length} components · {schematic.connections.length} connections
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Scroll to zoom · Drag to pan · Click to highlight
          </span>
          <button
            id="export-schematic-btn"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            ↓ Export PNG
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b flex flex-wrap gap-4 flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface-raised)" }}>
        {Object.entries(CONNECTION_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="h-px w-5" style={{ background: color }} />
            <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4 border-l pl-4" style={{ borderColor: "var(--border)" }}>
          {Object.entries(COMPONENT_BORDER_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COMPONENT_COLORS[type], border: `1.5px solid ${color}` }} />
              <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1"
        style={{ background: "var(--bg)", cursor: "grab", minHeight: "300px" }}
      />
    </div>
  );
}
