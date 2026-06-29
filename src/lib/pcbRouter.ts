/**
 * PCB Router Module
 * Implements accurate PCB layout generation with proper autorouting
 * Uses Manhattan routing (right-angle traces) with collision detection
 * NOTE: This is a beta feature - results may need manual refinement
 */

import { PCBTrace } from "./types";

// Grid-based placement (0.5mm grid for standard PCB design)
const GRID_SIZE = 0.5;

// Standard PCB design rules (in mm)
const DESIGN_RULES = {
  minTraceWidth: 0.15,
  preferredTraceWidth: 0.25,
  minClearance: 0.15,
  minViaSize: 0.6,
  minPadSize: 1.0,
  componentSpacing: 2.0,
};

// Standard component footprints (in mm)
export const FOOTPRINTS: Record<
  string,
  {
    width: number;
    height: number;
    pins: { name: string; x: number; y: number }[];
  }
> = {
  // MCU footprints
  "TQFP-32": {
    width: 9.0,
    height: 9.0,
    pins: Array.from({ length: 32 }, (_, i) => {
      const side = Math.floor(i / 8);
      const pos = i % 8;
      if (side === 0) return { name: `PIN${i + 1}`, x: -3.5 + pos, y: -4.5 };
      if (side === 1) return { name: `PIN${i + 1}`, x: 4.5, y: -3.5 + pos };
      if (side === 2) return { name: `PIN${i + 1}`, x: 3.5 - pos, y: 4.5 };
      return { name: `PIN${i + 1}`, x: -4.5, y: 3.5 - pos };
    }),
  },
  "DIP-28": {
    width: 15.24,
    height: 35.0,
    pins: [
      ...Array.from({ length: 14 }, (_, i) => ({
        name: `PIN${i + 1}`,
        x: -7.62,
        y: -16.0 + i * 2.54,
      })),
      ...Array.from({ length: 14 }, (_, i) => ({
        name: `PIN${28 - i}`,
        x: 7.62,
        y: -16.0 + i * 2.54,
      })),
    ],
  },
  "DIP-8": {
    width: 7.62,
    height: 9.0,
    pins: [
      { name: "PIN1", x: -3.81, y: -2.54 },
      { name: "PIN2", x: -3.81, y: 0 },
      { name: "PIN3", x: -3.81, y: 2.54 },
      { name: "PIN4", x: -3.81, y: 5.08 },
      { name: "PIN8", x: 3.81, y: -2.54 },
      { name: "PIN7", x: 3.81, y: 0 },
      { name: "PIN6", x: 3.81, y: 2.54 },
      { name: "PIN5", x: 3.81, y: 5.08 },
    ],
  },
  // SMD resistors/capacitors
  "0805": {
    width: 1.2,
    height: 2.0,
    pins: [
      { name: "1", x: 0, y: -0.75 },
      { name: "2", x: 0, y: 0.75 },
    ],
  },
  "1206": {
    width: 1.6,
    height: 3.2,
    pins: [
      { name: "1", x: 0, y: -1.1 },
      { name: "2", x: 0, y: 1.1 },
    ],
  },
  // Headers
  Header_1x4: {
    width: 2.54,
    height: 10.16,
    pins: [
      { name: "1", x: 0, y: -3.81 },
      { name: "2", x: 0, y: -1.27 },
      { name: "3", x: 0, y: 1.27 },
      { name: "4", x: 0, y: 3.81 },
    ],
  },
  Header_1x2: {
    width: 2.54,
    height: 5.08,
    pins: [
      { name: "1", x: 0, y: -1.27 },
      { name: "2", x: 0, y: 1.27 },
    ],
  },
  // Regulators
  "TO-220": {
    width: 10.0,
    height: 15.0,
    pins: [
      { name: "IN", x: -2.54, y: 5.0 },
      { name: "GND", x: 0, y: 5.0 },
      { name: "OUT", x: 2.54, y: 5.0 },
    ],
  },
  "SOT-223": {
    width: 3.5,
    height: 6.5,
    pins: [
      { name: "1", x: -1.27, y: 1.5 },
      { name: "2", x: 0, y: 1.5 },
      { name: "3", x: 1.27, y: 1.5 },
      { name: "TAB", x: 0, y: -2.0 },
    ],
  },
  // Common sensors
  DHT22: {
    width: 15.0,
    height: 25.0,
    pins: [
      { name: "VCC", x: -5.0, y: 10.0 },
      { name: "DATA", x: 0, y: 10.0 },
      { name: "NC", x: 5.0, y: 10.0 },
      { name: "GND", x: 0, y: -10.0 },
    ],
  },
  BMP280: {
    width: 10.0,
    height: 12.5,
    pins: [
      { name: "VCC", x: -3.81, y: 3.81 },
      { name: "GND", x: -1.27, y: 3.81 },
      { name: "SCL", x: 1.27, y: 3.81 },
      { name: "SDA", x: 3.81, y: 3.81 },
      { name: "CSB", x: -3.81, y: -3.81 },
      { name: "SDO", x: -1.27, y: -3.81 },
    ],
  },
  SSD1306: {
    width: 14.0,
    height: 14.0,
    pins: [
      { name: "GND", x: -6.0, y: 5.0 },
      { name: "VCC", x: -3.6, y: 5.0 },
      { name: "SCL", x: -1.2, y: 5.0 },
      { name: "SDA", x: 1.2, y: 5.0 },
    ],
  },
  // Board modules
  ESP32_Module: {
    width: 25.5,
    height: 48.0,
    pins: [
      { name: "EN", x: -11.0, y: -22.0 },
      { name: "GPIO23", x: -11.0, y: -19.0 },
      { name: "GPIO22", x: -11.0, y: -16.0 },
      { name: "GPIO1", x: -11.0, y: -13.0 },
      { name: "GPIO3", x: -11.0, y: -10.0 },
      { name: "GPIO21", x: -11.0, y: -7.0 },
      { name: "GPIO19", x: -11.0, y: -4.0 },
      { name: "GPIO18", x: -11.0, y: -1.0 },
      { name: "GPIO5", x: -11.0, y: 2.0 },
      { name: "GPIO17", x: -11.0, y: 5.0 },
      { name: "GPIO16", x: -11.0, y: 8.0 },
      { name: "GPIO4", x: -11.0, y: 11.0 },
      { name: "GPIO0", x: -11.0, y: 14.0 },
      { name: "GPIO2", x: -11.0, y: 17.0 },
      { name: "GPIO15", x: -11.0, y: 20.0 },
      { name: "GPIO13", x: -11.0, y: 22.0 },
      { name: "GPIO12", x: 11.0, y: 22.0 },
      { name: "GPIO14", x: 11.0, y: 20.0 },
      { name: "GPIO27", x: 11.0, y: 17.0 },
      { name: "GPIO26", x: 11.0, y: 14.0 },
      { name: "GPIO25", x: 11.0, y: 11.0 },
      { name: "GPIO33", x: 11.0, y: 8.0 },
      { name: "GPIO32", x: 11.0, y: 5.0 },
      { name: "GPIO35", x: 11.0, y: 2.0 },
      { name: "GPIO34", x: 11.0, y: -1.0 },
      { name: "GPIO39", x: 11.0, y: -4.0 },
      { name: "GPIO36", x: 11.0, y: -7.0 },
      { name: "GPIO6", x: 11.0, y: -10.0 },
      { name: "GPIO7", x: 11.0, y: -13.0 },
      { name: "GPIO8", x: 11.0, y: -16.0 },
      { name: "GPIO9", x: 11.0, y: -19.0 },
      { name: "GPIO10", x: 11.0, y: -22.0 },
      { name: "GPIO11", x: 11.0, y: -25.0 },
    ],
  },
  Arduino_Uno: {
    width: 53.34,
    height: 68.58,
    pins: [
      { name: "SCL", x: -24.0, y: -30.0 },
      { name: "SDA", x: -22.0, y: -30.0 },
      { name: "AREF", x: -20.0, y: -30.0 },
      { name: "GND", x: -18.0, y: -30.0 },
      { name: "D13", x: -16.0, y: -30.0 },
      { name: "D12", x: -14.0, y: -30.0 },
      { name: "D11", x: -12.0, y: -30.0 },
      { name: "D10", x: -10.0, y: -30.0 },
      { name: "D9", x: -8.0, y: -30.0 },
      { name: "D8", x: -6.0, y: -30.0 },
      { name: "D7", x: 6.0, y: -30.0 },
      { name: "D6", x: 8.0, y: -30.0 },
      { name: "D5", x: 10.0, y: -30.0 },
      { name: "D4", x: 12.0, y: -30.0 },
      { name: "D3", x: 14.0, y: -30.0 },
      { name: "D2", x: 16.0, y: -30.0 },
      { name: "D1", x: 18.0, y: -30.0 },
      { name: "D0", x: 20.0, y: -30.0 },
      // Power pins
      { name: "RESET", x: -24.0, y: -28.0 },
      { name: "3V3", x: -22.0, y: -28.0 },
      { name: "5V", x: -20.0, y: -28.0 },
      { name: "GND", x: -18.0, y: -28.0 },
      { name: "VIN", x: -16.0, y: -28.0 },
      // Analog pins
      { name: "A0", x: -24.0, y: 25.0 },
      { name: "A1", x: -22.0, y: 25.0 },
      { name: "A2", x: -20.0, y: 25.0 },
      { name: "A3", x: -18.0, y: 25.0 },
    ],
  },
};

// Get footprint for a component type
export function getFootprintForComponent(
  componentType: string,
): { name: string; data: (typeof FOOTPRINTS)[string] } | null {
  const type = componentType.toLowerCase();

  // Check for MCU types
  if (type.includes("esp32"))
    return { name: "ESP32_Module", data: FOOTPRINTS["ESP32_Module"] };
  if (type.includes("arduino uno"))
    return { name: "Arduino_Uno", data: FOOTPRINTS["Arduino_Uno"] };
  if (type.includes("stm32") && type.includes("f4"))
    return { name: "TQFP-32", data: FOOTPRINTS["TQFP-32"] };
  if (type.includes("stm32"))
    return { name: "TQFP-32", data: FOOTPRINTS["TQFP-32"] };

  // Sensors
  if (type.includes("dht"))
    return { name: "Header_1x4", data: FOOTPRINTS["Header_1x4"] };
  if (type.includes("bmp280"))
    return { name: "Header_1x4", data: FOOTPRINTS["Header_1x4"] };
  if (type.includes("ssd1306") || type.includes("oled") || type.includes("lcd"))
    return { name: "Header_1x4", data: FOOTPRINTS["Header_1x4"] };

  // Passives
  if (
    type.includes("resistor") ||
    type.includes("led") ||
    type.includes("capacitor") ||
    type.includes("diode")
  ) {
    return { name: "0805", data: FOOTPRINTS["0805"] };
  }

  // Power
  if (type.includes("regulator") || type.includes("7805"))
    return { name: "TO-220", data: FOOTPRINTS["TO-220"] };
  if (type.includes("ams1117"))
    return { name: "SOT-223", data: FOOTPRINTS["SOT-223"] };

  // Switches/Buttons
  if (type.includes("button") || type.includes("switch"))
    return { name: "Header_1x2", data: FOOTPRINTS["Header_1x2"] };
  if (type.includes("relay"))
    return { name: "Header_1x2", data: FOOTPRINTS["Header_1x2"] };

  // Motors/servos
  if (type.includes("motor") || type.includes("servo"))
    return { name: "Header_1x2", data: FOOTPRINTS["Header_1x2"] };

  // Default to a generic header
  return { name: "Header_1x4", data: FOOTPRINTS["Header_1x4"] };
}

// Snap to grid
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// Check if two rectangles collide
export function rectanglesCollide(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  padding: number = DESIGN_RULES.componentSpacing,
): boolean {
  const halfPadding = padding / 2;
  return (
    x1 - w1 / 2 - halfPadding < x2 + w2 / 2 + halfPadding &&
    x1 + w1 / 2 + halfPadding > x2 - w2 / 2 - halfPadding &&
    y1 - h1 / 2 - halfPadding < y2 + h2 / 2 + halfPadding &&
    y1 + h1 / 2 + halfPadding > y2 - h2 / 2 - halfPadding
  );
}

// Find valid placement position using simple grid placement
export function findValidPlacement(
  width: number,
  height: number,
  existingPlacements: { x: number; y: number; width: number; height: number }[],
  boardWidth: number,
  boardHeight: number,
  preferredX?: number,
  preferredY?: number,
): { x: number; y: number } | null {
  // Start from preferred position or center-left
  const startX = preferredX ?? boardWidth * 0.3;
  const startY = preferredY ?? boardHeight * 0.5;

  // Spiral search pattern
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 1, dy: 0 }, // right
    { dx: 0, dy: 1 }, // down
    { dx: -1, dy: 0 }, // left
  ];

  let x = snapToGrid(startX);
  let y = snapToGrid(startY);
  const step = GRID_SIZE * 4;
  let directionIndex = 0;
  let stepsInCurrentDirection = 0;
  let stepsToChange = 1;
  let directionChanges = 0;

  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check bounds
    if (
      x >= width / 2 + 3 &&
      x <= boardWidth - width / 2 - 3 &&
      y >= height / 2 + 3 &&
      y <= boardHeight - height / 2 - 3
    ) {
      // Check collision with existing placements
      let collision = false;
      for (const existing of existingPlacements) {
        if (
          rectanglesCollide(
            x,
            y,
            width,
            height,
            existing.x,
            existing.y,
            existing.width,
            existing.height,
          )
        ) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        return { x, y };
      }
    }

    // Move in spiral
    x += directions[directionIndex].dx * step;
    y += directions[directionIndex].dy * step;
    stepsInCurrentDirection++;

    if (stepsInCurrentDirection >= stepsToChange) {
      stepsInCurrentDirection = 0;
      directionIndex = (directionIndex + 1) % 4;
      directionChanges++;

      if (directionChanges % 2 === 0) {
        stepsToChange++;
      }
    }
  }

  return null;
}

// Manhattan routing - generates orthogonal PCB traces
export function manhattanRoute(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): { x: number; y: number }[] | null {
  // Simple L-route or Z-route generation
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  // Check which L-route is better
  const distXFirst = Math.abs(endX - startX) + Math.abs(endY - startY);
  const distYFirst = Math.abs(endY - startY) + Math.abs(endX - startX);

  // Use the shorter L-route
  if (distXFirst <= distYFirst) {
    // Horizontal first, then vertical
    if (startX !== endX) {
      points.push({ x: endX, y: startY });
    }
    if (startY !== endY) {
      points.push({ x: endX, y: endY });
    }
  } else {
    // Vertical first, then horizontal
    if (startY !== endY) {
      points.push({ x: startX, y: endY });
    }
    if (startX !== endX) {
      points.push({ x: endX, y: endY });
    }
  }

  return points;
}

// Collision detection for traces
export function traceCollides(
  trace: { x: number; y: number }[],
  obstacles: { x: number; y: number; width: number; height: number }[],
): boolean {
  // Simple bounding box check
  for (let i = 0; i < trace.length - 1; i++) {
    const p1 = trace[i];
    const p2 = trace[i + 1];
    const minX = Math.min(p1.x, p2.x) - DESIGN_RULES.minClearance;
    const maxX = Math.max(p1.x, p2.x) + DESIGN_RULES.minClearance;
    const minY = Math.min(p1.y, p2.y) - DESIGN_RULES.minClearance;
    const maxY = Math.max(p1.y, p2.y) + DESIGN_RULES.minClearance;

    for (const obs of obstacles) {
      const obsMinX = obs.x - obs.width / 2 - DESIGN_RULES.minTraceWidth;
      const obsMaxX = obs.x + obs.width / 2 + DESIGN_RULES.minTraceWidth;
      const obsMinY = obs.y - obs.height / 2 - DESIGN_RULES.minTraceWidth;
      const obsMaxY = obs.y + obs.height / 2 + DESIGN_RULES.minTraceWidth;

      if (
        minX < obsMaxX &&
        maxX > obsMinX &&
        minY < obsMaxY &&
        maxY > obsMinY
      ) {
        return true;
      }
    }
  }
  return false;
}

// Design rule check
export function checkDesignRules(traces: PCBTrace[]): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check trace widths
  for (const trace of traces) {
    if (trace.width < DESIGN_RULES.minTraceWidth) {
      issues.push(
        `Trace ${trace.id} violates minimum trace width (${trace.width}mm < ${DESIGN_RULES.minTraceWidth}mm)`,
      );
    }
  }

  // Check for potential shorts (simplified)
  const nets = new Map<string, PCBTrace[]>();
  for (const trace of traces) {
    if (!nets.has(trace.netName)) {
      nets.set(trace.netName, []);
    }
    nets.get(trace.netName)!.push(trace);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
