import { generateJSON } from "../gemini";
import { CircuitSchematic } from "../types";
import { BASE_PROMPT } from "./promptBase";

export async function CircuitSchematicAgent(
  components: string[],
  pins: Array<{ component: string; pin: string; boardPin: string; signalType: string }>,
  board: string,
): Promise<CircuitSchematic> {
  const pinSummary = pins
    .slice(0, 40)
    .map((p) => `${p.component}.${p.pin} -> ${p.boardPin} (${p.signalType})`)
    .join("\n");

  const example = {
    components: [{ id: "arduino_uno", type: "mcu", variant: "Arduino Uno", x: 100, y: 300 }],
    connections: [],
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nComponents: ${components.join(", ")}\n\nPin assignments:\n${pinSummary}\n\nGenerate a schematic layout for a Konva.js canvas (800x600 logical pixels). Place the microcontroller/board in the center‑left area. Place sensors/modules around it with good spacing (min 150px apart). Use unique IDs (e.g. "esp32_main", "dht22_1"). Types: "mcu", "sensor", "power", "module".\n\nFor connections, specify exact pin‑to‑pin links using "from", "to", "fromPin", "toPin".\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<CircuitSchematic>(prompt);
}
