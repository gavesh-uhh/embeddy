import { generateJSON } from "../gemini";
import { ProjectOverview } from "../types";

export async function ProjectOverviewAgent(
  description: string,
  fileContents: string[],
  board?: string,
): Promise<ProjectOverview> {
  const docsSection =
    fileContents.length > 0
      ? `\n\nSupporting documents:\n${fileContents.map((c, i) => `--- Document ${i + 1} ---\n${c.slice(0, 3000)}`).join("\n\n")}`
      : "";

  import { BASE_PROMPT } from "./promptBase";

  const example = {
    summary: "A simple temperature sensor that logs to Serial",
    board: "Arduino Uno",
    components: ["Temperature sensor", "Resistor", "Breadboard"],
    goals: ["Read temperature", "Display on Serial"],
    warnings: [],
  };

  const prompt = `${BASE_PROMPT}\n\nProject description: ${description}${docsSection}\n${board ? `Preferred board: ${board}` : ""}\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<ProjectOverview>(prompt);
}
