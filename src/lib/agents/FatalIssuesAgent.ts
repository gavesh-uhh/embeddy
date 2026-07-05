import { generateJSON } from "../gemini";
import { FatalIssues } from "../types";
import { BASE_PROMPT } from "./promptBase";

export async function FatalIssuesAgent(
  board: string,
  components: string[],
  description: string,
  warnings: string[],
): Promise<FatalIssues> {
  const example = {
    issues: [
      {
        severity: "warning",
        title: "Missing decoupling capacitor",
        description:
          "The MCU power rail lacks a 0.1µF decoupling capacitor, which can cause voltage spikes.",
        affectedComponents: ["Arduino Uno"],
      },
    ],
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nComponents: ${components.join(", ")}\nProject description: ${description}\n${warnings.length > 0 ? `Existing warnings from analysis: ${warnings.join(", ")}` : ""}\n\nIdentify all issues: fatal errors, warnings, and info.\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<FatalIssues>(prompt);
}
