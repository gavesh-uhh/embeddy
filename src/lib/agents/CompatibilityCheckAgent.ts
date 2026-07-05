import { generateJSON } from "../gemini";
import { CompatibilityChecks } from "../types";

export async function CompatibilityCheckAgent(
  board: string,
  components: string[],
): Promise<CompatibilityChecks> {
  import { BASE_PROMPT } from "./promptBase";

  const example = {
    checks: [
      {
        component: "LED",
        issue: "",
        resolution: "",
        voltageConflict: false,
      },
    ],
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nComponents: ${components.join(", ")}\n\nFor each component, check voltage compatibility, protocol support, library availability, physical issues, and power requirements.\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<CompatibilityChecks>(prompt);
}
