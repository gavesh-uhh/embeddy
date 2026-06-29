export type BoardType =
  | "Arduino Uno"
  | "Arduino Mega"
  | "ESP32"
  | "ESP32-S3"
  | "STM32F103"
  | "STM32F4";
export type SignalType =
  "power" | "ground" | "digital" | "analog" | "i2c" | "spi" | "uart";
export type Severity = "fatal" | "warning" | "info";
export type Availability = "common" | "moderate" | "rare";

export interface ProjectOverview {
  summary: string;
  board: BoardType;
  components: string[];
  goals: string[];
  warnings: string[];
}

export interface Pin {
  component: string;
  pin: string;
  boardPin: string;
  signalType: SignalType;
  voltage: string;
}

export interface PinDiagram {
  pins: Pin[];
}

export interface SchematicComponent {
  id: string;
  type: string;
  variant: string;
  x: number;
  y: number;
}

export interface SchematicConnection {
  from: string;
  fromPin?: string;
  to: string;
  toPin?: string;
  signalType: "power" | "ground" | "data" | "analog";
}

export interface CircuitSchematic {
  components: SchematicComponent[];
  connections: SchematicConnection[];
}

export interface FatalIssue {
  severity: Severity;
  title: string;
  description: string;
  affectedComponents: string[];
}

export interface FatalIssues {
  issues: FatalIssue[];
}

export interface CompatibilityCheck {
  component: string;
  issue: string;
  resolution: string;
  voltageConflict: boolean;
}

export interface CompatibilityChecks {
  checks: CompatibilityCheck[];
}

export interface PowerComponent {
  name: string;
  currentMa: number;
  voltage: number;
}

export interface PowerBudget {
  totalCurrentMa: number;
  components: PowerComponent[];
  supplyRecommendation: string;
  overBudget: boolean;
}

export interface BOMItem {
  name: string;
  quantity: number;
  description: string;
  estimatedLKR: number;
}

export interface BOM {
  items: BOMItem[];
  totalEstimatedLKR: number;
}

export interface CodeSkeleton {
  language: "C++" | "MicroPython";
  framework: "Arduino" | "ESP-IDF" | "STM32 HAL";
  code: string;
}

export interface ComponentSource {
  component: string;
  availability: Availability;
  notes: string;
}

export interface PCBTrace {
  id: string;
  points: { x: number; y: number }[];
  width: number;
  layer: "top" | "bottom" | "via";
  netName: string;
}

export interface PCBPad {
  id: string;
  componentId: string;
  pinName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rect" | "circle" | "oval";
  layer: "top" | "bottom" | "both";
  netName?: string;
}

export interface PCBComponentPlacement {
  id: string;
  componentId: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  footprint: string;
  layer: "top" | "bottom";
}

export interface PCBLayers {
  topCopper: boolean;
  bottomCopper: boolean;
  topSilkscreen: boolean;
  bottomSilkscreen: boolean;
  topMask: boolean;
  bottomMask: boolean;
}

export interface PCBDesignRules {
  minTraceWidth: number;
  minViaSize: number;
  minClearance: number;
  preferredTraceWidth: number;
}

export interface PCBLayout {
  version: string;
  boardWidth: number;
  boardHeight: number;
  placements: PCBComponentPlacement[];
  traces: PCBTrace[];
  pads: PCBPad[];
  layers: PCBLayers;
  designRules: PCBDesignRules;
  mountingHoles: { x: number; y: number; diameter: number }[];
}

export interface ProjectContext {
  title: string;
  board: BoardType;
  description: string;
  fileContents: string[];
  components?: string[];
  pins?: Pin[];
  warnings?: string[];
  bomItems?: BOMItem[];
  language?: "C++" | "MicroPython";
  framework?: "Arduino" | "ESP-IDF" | "STM32 HAL";
}

export interface ProjectData {
  id: string;
  title: string;
  board: BoardType;
  description: string;
  createdAt: string;
  overview?: ProjectOverview;
  pinDiagram?: PinDiagram;
  schematic?: CircuitSchematic;
  fatalIssues?: FatalIssues;
  compatibility?: CompatibilityChecks;
  powerBudget?: PowerBudget;
  bom?: BOM;
  codeSkeleton?: CodeSkeleton;
  pcbLayout?: PCBLayout;
  errors?: Record<string, string>;
}
