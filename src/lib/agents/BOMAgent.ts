import { generateJSON } from "../gemini";
import { BOM } from "../types";

export async function BOMAgent(components: string[]): Promise<BOM> {
  import { BASE_PROMPT } from "./promptBase";

  const example = {
    items: [
      {
        name: "LED 5mm",
        quantity: 2,
        description: "Standard red LED, 2V forward voltage",
        estimatedLKR: 120.0,
      },
    ],
    totalEstimatedLKR: 240.0,
  };

  const prompt = `${BASE_PROMPT}\n\nComponents needed: ${components.join(", ")}\n\nProvide realistic pricing, quantity, and description. Also include common passives.\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<BOM>(prompt);
}
