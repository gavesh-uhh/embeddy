import { generateJSON } from "../gemini";
import { CompatibilityChecks } from "../types";

export async function CompatibilityCheckAgent(
  board: string,
  components: string[]
): Promise<CompatibilityChecks> {
  const prompt = `You are an expert embedded systems engineer. Check hardware compatibility between components and the selected board.

Board: ${board}
Components: ${components.join(", ")}

For each component, check:
- Voltage compatibility (3.3V vs 5V logic levels)
- Communication protocol support (I2C, SPI, UART availability on board)
- Library availability for the board
- Physical compatibility issues
- Power requirements

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "checks": [
    {
      "component": "component name",
      "issue": "description of any compatibility issue (empty string if fully compatible)",
      "resolution": "how to resolve the issue (empty string if no issue)",
      "voltageConflict": true | false
    }
  ]
}

Include an entry for every component. If a component is fully compatible, still include it with empty issue/resolution and voltageConflict: false. Return only JSON.`;

  return generateJSON<CompatibilityChecks>(prompt);
}
