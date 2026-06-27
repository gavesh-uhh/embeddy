import { generateJSON } from "../gemini";
import { BOM } from "../types";

export async function BOMAgent(components: string[]): Promise<BOM> {
  const prompt = `You are an expert electronics procurement engineer. Generate a Bill of Materials for this project.

Components needed: ${components.join(", ")}

For each component, provide realistic current market pricing (LKR) from sources like Daraz, MakerMinds, Scion Electronics, or other local/international suppliers shipping to Sri Lanka.
Include quantity needed and a brief technical description.
Also include common passive components that are typically needed (resistors, capacitors, wire, headers, etc.).

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "items": [
    {
      "name": "exact component/part name",
      "quantity": 1,
      "description": "brief technical description and specs",
      "estimatedLKR": 3500.00
    }
  ],
  "totalEstimatedLKR": 14500.50
}

Include shipping-friendly items. Calculate totalEstimatedLKR as the sum of (quantity * estimatedLKR) for all items. Return only JSON.`;

  return generateJSON<BOM>(prompt);
}
