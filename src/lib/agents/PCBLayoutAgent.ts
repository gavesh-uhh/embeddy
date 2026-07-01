/**
 * PCB Layout Agent
 * Generates accurate PCB layouts using proper autorouting algorithms
 * BETA FEATURE: Results may require manual verification and adjustment
 */

import {
  PCBLayout,
  Pin,
  CircuitSchematic,
  PCBTrace,
  PCBPad,
  PCBComponentPlacement,
} from "../types";
import {
  FOOTPRINTS,
  snapToGrid,
  findValidPlacement,
  manhattanRoute,
  checkDesignRules,
} from "../pcbRouter";


const BOARD_CONFIGS: Record<
  string,
  { width: number; height: number; mcuFootprint: string }
> = {
  "Arduino Uno": { width: 68.58, height: 53.34, mcuFootprint: "DIP-28" },
  "Arduino Mega": { width: 101.6, height: 53.34, mcuFootprint: "DIP-28" },
  ESP32: { width: 50, height: 70, mcuFootprint: "ESP32_Module" },
  "ESP32-S3": { width: 50, height: 70, mcuFootprint: "ESP32_Module" },
  STM32F103: { width: 50, height: 70, mcuFootprint: "TQFP-32" },
  STM32F4: { width: 60, height: 80, mcuFootprint: "TQFP-32" },
};


function getComponentFootprint(componentType: string): string {
  const type = componentType.toLowerCase();

  if (type.includes("esp32")) return "ESP32_Module";
  if (type.includes("arduino uno")) return "Arduino_Uno";
  if (type.includes("stm32")) return "TQFP-32";
  if (type.includes("dht")) return "Header_1x4";
  if (type.includes("oled") || type.includes("ssd1306") || type.includes("lcd"))
    return "Header_1x4";
  if (type.includes("servo") || type.includes("motor")) return "Header_1x2";
  if (
    type.includes("resistor") ||
    type.includes("led") ||
    type.includes("capacitor") ||
    type.includes("diode")
  )
    return "0805";
  if (type.includes("regulator") || type.includes("7805")) return "TO-220";
  if (type.includes("button") || type.includes("switch")) return "Header_1x2";
  if (type.includes("relay")) return "Header_1x2";
  if (type.includes("sensor")) return "Header_1x4";

  return "0805";
}


function generatePlacement(
  componentId: string,
  componentType: string,
  boardWidth: number,
  boardHeight: number,
  existingPlacements: { x: number; y: number; width: number; height: number }[],
  isMCU: boolean,
): {
  placement: PCBComponentPlacement;
  footprint: (typeof FOOTPRINTS)[string];
} | null {
  const footprintName = getComponentFootprint(componentType);
  const footprint = FOOTPRINTS[footprintName] || FOOTPRINTS["0805"];

  
  const preferredX = isMCU ? boardWidth * 0.25 : boardWidth * 0.6;
  const preferredY = isMCU ? boardHeight * 0.5 : undefined;

  const position = findValidPlacement(
    footprint.width,
    footprint.height,
    existingPlacements,
    boardWidth,
    boardHeight,
    preferredX,
    preferredY,
  );

  if (!position) {
    return null;
  }

  const placement: PCBComponentPlacement = {
    id: `placement_${componentId}`,
    componentId,
    name: isMCU ? "MCU" : componentType.slice(0, 8).toUpperCase(),
    x: position.x,
    y: position.y,
    rotation: 0,
    footprint: footprintName,
    layer: "top",
  };

  return { placement, footprint };
}


function generatePads(
  placement: PCBComponentPlacement,
  footprint: (typeof FOOTPRINTS)[string],
  pinData: { component: string; pin: string; signalType: string }[],
): PCBPad[] {
  const pads: PCBPad[] = [];

  
  const componentPins = pinData.filter(
    (p) => p.component === placement.componentId,
  );

  for (let i = 0; i < footprint.pins.length; i++) {
    const fpPin = footprint.pins[i];
    const schematicPin =
      componentPins.find((p) => p.pin === fpPin.name) || componentPins[i];

    const pad: PCBPad = {
      id: `pad_${placement.id}_${i}`,
      componentId: placement.id,
      pinName: fpPin.name,
      x: snapToGrid(placement.x + fpPin.x),
      y: snapToGrid(placement.y + fpPin.y),
      width: 1.5,
      height: 1.5,
      shape: i === 0 ? "rect" : "circle", 
      layer: "top",
      netName: schematicPin
        ? schematicPin.signalType === "power"
          ? "VCC"
          : schematicPin.signalType === "ground"
            ? "GND"
            : `${schematicPin.component}_${schematicPin.pin}`
        : undefined,
    };
    pads.push(pad);
  }

  return pads;
}


async function generateTraces(
  schematic: CircuitSchematic,
  placements: PCBComponentPlacement[],
  pads: PCBPad[],
  boardWidth: number,
  boardHeight: number,
): Promise<PCBTrace[]> {
  const traces: PCBTrace[] = [];
  let traceId = 1;

  try {
    const mod = await import("@tscircuit/capacity-autorouter");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { autoroute } = mod as any;
    const autorouteResult = autoroute({
      boardWidth,
      boardHeight,
      pads,
      connections: schematic.connections,
    });
    if (Array.isArray(autorouteResult)) {
      type AutorouteTrace = {
        id?: string;
        points: { x: number; y: number }[];
        width?: number;
        signalType?: string;
        netName?: string;
      };
      return (autorouteResult as AutorouteTrace[]).map((r, idx) => ({
        id: r.id ?? `t${idx + 1}`,
        points: r.points.map((p) => ({ x: p.x, y: p.y })),
        width: r.width ?? (r.signalType === "power" ? 0.5 : 0.25),
        layer: "top",
        netName: r.netName ?? `NET_${idx}`,
      }));
    }
  } catch {
    console.warn("tScircuit autorouter unavailable; using fallback routing");
  }

  for (const conn of schematic.connections) {
    const fromPlacement = placements.find((p) => p.componentId === conn.from);
    const toPlacement = placements.find((p) => p.componentId === conn.to);

    if (!fromPlacement || !toPlacement) continue;

    // Find corresponding pads
    const fromPads = pads.filter((p) => p.componentId === fromPlacement.id);
    const toPads = pads.filter((p) => p.componentId === toPlacement.id);

    if (fromPads.length === 0 || toPads.length === 0) continue;

    const fromPad = fromPads[0]; 
    const toPad = toPads[0];

    
    const route = manhattanRoute(fromPad.x, fromPad.y, toPad.x, toPad.y);

    if (route && route.length >= 2) {
      const trace: PCBTrace = {
        id: `t${traceId++}`,
        points: route,
        width: conn.signalType === "power" ? 0.5 : 0.25,
        layer: "top",
        netName:
          conn.signalType === "power"
            ? "VCC"
            : conn.signalType === "ground"
              ? "GND"
              : `NET_${conn.from}_${conn.to}`,
      };
      traces.push(trace);
    }
  }

  return traces;
}

export async function PCBLayoutAgent(
  components: string[],
  pins: Pin[],
  schematic: CircuitSchematic,
  board: string,
): Promise<PCBLayout> {
  
  const boardConfig = BOARD_CONFIGS[board] || BOARD_CONFIGS["ESP32"];
  const boardWidth = boardConfig.width;
  const boardHeight = boardConfig.height;

  
  const existingPlacements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  const placements: PCBComponentPlacement[] = [];
  const allPads: PCBPad[] = [];

  
  const mcuComponent =
    schematic.components.find(
      (c) =>
        c.type.toLowerCase().includes(board.toLowerCase()) ||
        c.type.toLowerCase().includes("microcontroller") ||
        c.type.toLowerCase().includes("esp32") ||
        c.type.toLowerCase().includes("arduino"),
    ) || schematic.components[0];

  if (mcuComponent) {
    const mcuResult = generatePlacement(
      mcuComponent.id,
      board,
      boardWidth,
      boardHeight,
      existingPlacements,
      true,
    );

    if (mcuResult) {
      placements.push(mcuResult.placement);
      existingPlacements.push({
        x: mcuResult.placement.x,
        y: mcuResult.placement.y,
        width: mcuResult.footprint.width + 2,
        height: mcuResult.footprint.height + 2,
      });

      const mcuPads = generatePads(
        mcuResult.placement,
        mcuResult.footprint,
        pins.map((p) => ({
          component: p.component,
          pin: p.pin,
          signalType: p.signalType,
        })),
      );
      allPads.push(...mcuPads);
    }
  }

  
  for (const comp of schematic.components) {
    if (placements.some((p) => p.componentId === comp.id)) continue; 

    const result = generatePlacement(
      comp.id,
      comp.type,
      boardWidth,
      boardHeight,
      existingPlacements,
      false,
    );

    if (result) {
      placements.push(result.placement);
      existingPlacements.push({
        x: result.placement.x,
        y: result.placement.y,
        width: result.footprint.width + 2,
        height: result.footprint.height + 2,
      });

      const compPads = generatePads(
        result.placement,
        result.footprint,
        pins.map((p) => ({
          component: p.component,
          pin: p.pin,
          signalType: p.signalType,
        })),
      );
      allPads.push(...compPads);
    }
  }

  
  const traces = await generateTraces(
    schematic,
    placements,
    allPads,
    boardWidth,
    boardHeight,
  );

  
  const mountingHoles = [
    { x: 3, y: 3, diameter: 3.2 },
    { x: boardWidth - 3, y: 3, diameter: 3.2 },
    { x: 3, y: boardHeight - 3, diameter: 3.2 },
    { x: boardWidth - 3, y: boardHeight - 3, diameter: 3.2 },
  ];

  
  const drc = checkDesignRules(traces);
  if (!drc.passed) {
    console.warn("PCB Layout DRC warnings:", drc.issues);
  }

  const pcbLayout: PCBLayout = {
    version: "1.0-beta",
    boardWidth,
    boardHeight,
    placements,
    traces,
    pads: allPads,
    layers: {
      topCopper: true,
      bottomCopper: true,
      topSilkscreen: true,
      bottomSilkscreen: false,
      topMask: true,
      bottomMask: true,
    },
    designRules: {
      minTraceWidth: 0.15,
      minViaSize: 0.6,
      minClearance: 0.15,
      preferredTraceWidth: 0.25,
    },
    mountingHoles,
  };

  return pcbLayout;
}
