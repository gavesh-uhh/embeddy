import { generateJSON } from "../gemini";
import { ProjectOverview } from "../types";

export async function ProjectOverviewAgent(
  description: string,
  fileContents: string[],
  board?: string
): Promise<ProjectOverview> {
  const docsSection = fileContents.length > 0
    ? `\n\nSupporting documents:\n${fileContents.map((c, i) => `--- Document ${i + 1} ---\n${c.slice(0, 3000)}`).join("\n\n")}`
    : "";

  const prompt = `You are an expert embedded systems engineer. Analyze this project description and extract structured information.

Project description: ${description}${docsSection}
${board ? `Preferred board: ${board}` : ""}

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "summary": "2-3 sentence technical summary of the project",
  "board": "Arduino Uno" | "Arduino Mega" | "ESP32" | "ESP32-S3" | "STM32F103" | "STM32F4",
  "components": ["list of hardware components needed"],
  "goals": ["list of technical goals/features"],
  "warnings": ["list of potential design warnings or considerations"]
}

Choose the most appropriate board based on the description. Return only JSON.`;

  return generateJSON<ProjectOverview>(prompt);
}
