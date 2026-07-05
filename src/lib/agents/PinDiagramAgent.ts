import { generateJSON } from "../gemini";
import { PinDiagram } from "../types";

export async function PinDiagramAgent(components: string[], board: string): Promise<PinDiagram> {
  import { BASE_PROMPT } from "./promptBase";

  const example = {
    pins: [
      {
        component: "LED",
        pin: "Anode",
        boardPin: "D2",
        signalType: "digital",
        voltage: "3.3V",
      },
    ],
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nComponents: ${components.join(", ")}\n\nCreate a complete pin assignment table for all components on this board. Consider I2C uses SDA/SCL pins, SPI uses MOSI/MISO/SCK/CS, UART uses TX/RX. Assign specific board pins (e.g., "GPIO4", "D2", "PA5") — not generic references. Each component may have multiple pins (power, ground, data signals).\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<PinDiagram>(prompt);
}
