import { generateJSON } from "../gemini";
import { PowerBudget } from "../types";
import { BASE_PROMPT } from "./promptBase";

export async function PowerBudgetAgent(components: string[], board: string): Promise<PowerBudget> {
  const example = {
    totalCurrentMa: 150,
    components: [
      { name: "Arduino Uno", currentMa: 50, voltage: 5 },
      { name: "LED", currentMa: 20, voltage: 5 },
    ],
    supplyRecommendation: "5V 1A USB supply",
    overBudget: false,
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nComponents: ${components.join(", ")}\n\nResearch typical current consumption, calculate total current, consider peak vs average, and suggest a supply.\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<PowerBudget>(prompt);
}
