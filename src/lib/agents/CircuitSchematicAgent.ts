import { generateJSON } from "../gemini";
import { CircuitSchematic } from "../types";

export async function CircuitSchematicAgent(
  components: string[],
  pins: Array<{ component: string; pin: string; boardPin: string; signalType: string }>,
  board: string
): Promise<CircuitSchematic> {
  const pinSummary = pins
    .slice(0, 40) // limit context size
    .map((p) => `${p.component}.${p.pin} -> ${p.boardPin} (${p.signalType})`)
    .join("\n");

  const prompt = `You are an expert embedded systems engineer generating a circuit schematic layout.

Board: ${board}
Components: ${components.join(", ")}

Pin assignments:
${pinSummary}

Generate a schematic layout for a Konva.js canvas (800x600 logical pixels).
Place the microcontroller/board in the center-left area.
Place sensors and modules around it with good spacing (min 150px apart).
Use IDs that are unique slugs (e.g. "esp32_main", "dht22_1", "oled_display").
Type should be: "mcu" for microcontrollers, "sensor" for sensors, "power" for power modules, "module" for other modules.

For connections, specify exact pin-to-pin links using "from" and "to" (component IDs) as well as "fromPin" and "toPin" matching the pin assignments context.
For example: DHT22 pin "DATA" connects to ESP32 board pin "GPIO21".
Ensure every connection includes both component-level IDs and pin-level names.

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "components": [
    { "id": "unique_id", "type": "mcu|sensor|power|module", "variant": "exact component name", "x": 100, "y": 100 }
  ],
  "connections": [
    { "from": "component_id", "fromPin": "pin_name", "to": "component_id", "toPin": "board_pin_name", "signalType": "power|ground|data|analog" }
  ]
}

Ensure no two components overlap. Place MCU first. Return only JSON.`;

  return generateJSON<CircuitSchematic>(prompt);
}
