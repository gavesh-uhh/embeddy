import { generateJSON } from "../gemini";
import { PowerBudget } from "../types";

export async function PowerBudgetAgent(
  components: string[],
  board: string
): Promise<PowerBudget> {
  const prompt = `You are an expert embedded systems engineer. Calculate the power budget for this project.

Board: ${board}
Components: ${components.join(", ")}

Research typical current consumption for each component and the board itself.
Calculate total current at operating voltage.
A typical USB power supply provides 500mA. A 1A supply is common for ESP32 projects.
Consider peak vs average current.

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "totalCurrentMa": 350,
  "components": [
    { "name": "component name", "currentMa": 80, "voltage": 3.3 }
  ],
  "supplyRecommendation": "recommendation for power supply (e.g. '5V 1A USB supply or LiPo battery with 3.3V regulator')",
  "overBudget": false
}

Include the board/MCU itself as a component. Set overBudget to true if totalCurrentMa > 500mA for USB-powered projects. Return only JSON.`;

  return generateJSON<PowerBudget>(prompt);
}
