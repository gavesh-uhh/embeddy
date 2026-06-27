import { generateJSON } from "../gemini";
import { PinDiagram } from "../types";

export async function PinDiagramAgent(
  components: string[],
  board: string
): Promise<PinDiagram> {
  const prompt = `You are an expert embedded systems engineer specializing in hardware pin assignments.

Board: ${board}
Components: ${components.join(", ")}

Create a complete pin assignment table for all components on this board.
Consider: I2C uses SDA/SCL pins, SPI uses MOSI/MISO/SCK/CS, UART uses TX/RX.
Assign specific board pins (e.g., "GPIO4", "D2", "PA5") — not generic references.
Each component may have multiple pins (power, ground, data signals).

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "pins": [
    {
      "component": "component name",
      "pin": "component's own pin name (e.g. VCC, GND, SDA, DATA)",
      "boardPin": "specific board pin (e.g. 3.3V, GND, GPIO21, D4)",
      "signalType": "power" | "ground" | "digital" | "analog" | "i2c" | "spi" | "uart",
      "voltage": "voltage level (e.g. 3.3V, 5V, GND)"
    }
  ]
}

Include power and ground pins for every component. Return only JSON.`;

  return generateJSON<PinDiagram>(prompt);
}
