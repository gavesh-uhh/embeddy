import { generateJSON } from "../gemini";
import { FatalIssues } from "../types";

export async function FatalIssuesAgent(
  board: string,
  components: string[],
  description: string,
  warnings: string[]
): Promise<FatalIssues> {
  const prompt = `You are an expert embedded systems safety engineer. Analyze this project for potential issues.

Board: ${board}
Components: ${components.join(", ")}
Project description: ${description}
${warnings.length > 0 ? `Existing warnings from analysis: ${warnings.join(", ")}` : ""}

Identify all issues: fatal errors (will definitely cause failure/damage), warnings (may cause problems), and info (best practice notes).

Fatal examples: voltage mismatch (5V signal to 3.3V GPIO), no current limiting resistor on LED, insufficient power supply.
Warning examples: missing decoupling capacitors, long wire runs for high-speed signals.
Info examples: pull-up resistors recommended, consider adding a fuse.

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "issues": [
    {
      "severity": "fatal" | "warning" | "info",
      "title": "short issue title",
      "description": "detailed explanation of the issue and why it matters",
      "affectedComponents": ["list of component names involved"]
    }
  ]
}

If no issues found, return { "issues": [] }. Return only JSON.`;

  return generateJSON<FatalIssues>(prompt);
}
