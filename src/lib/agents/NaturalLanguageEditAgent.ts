import { generateJSON } from "../gemini";
import { ProjectContext } from "../types";

type EditOperation =
  | { type: "add_component"; component: string; description?: string }
  | { type: "remove_component"; component: string }
  | { type: "change_board"; newBoard: string; reason?: string }
  | { type: "modify_pin"; component: string; oldPin: string; newPin: string }
  | { type: "update_component"; component: string; newSpecs: string }
  | {
      type: "change_code_language";
      language: "C++" | "MicroPython";
      framework: "Arduino" | "ESP-IDF" | "STM32 HAL";
    }
  | { type: "regenerate_code" }
  | { type: "explain_design"; aspect?: string }
  | { type: "suggest_improvements" }
  | { type: "add_feature"; feature: string }
  | { type: "optimize_power" }
  | { type: "check_compatibility" };

export interface NaturalLanguageEditResult {
  operations: EditOperation[];
  explanation: string;
  warnings: string[];
  questions: string[];
  regenerated: {
    overview?: boolean;
    pinDiagram?: boolean;
    schematic?: boolean;
    bom?: boolean;
    powerBudget?: boolean;
    codeSkeleton?: boolean;
  };
}

export async function NaturalLanguageEditAgent(
  projectContext: ProjectContext,
  userCommand: string,
  commandHistory: string[] = [],
): Promise<NaturalLanguageEditResult> {
  const historyContext =
    commandHistory.length > 0
      ? `\nPrevious commands in this conversation:\n${commandHistory.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";

  const prompt = `You are an expert embedded systems engineer and AI assistant for the Embeddy platform.

You have access to a project with the following context:
- Title: ${projectContext.title}
- Board: ${projectContext.board}
- Description: ${projectContext.description}
- Components: ${projectContext.components?.join(", ") || "None yet"}
- Pins: ${projectContext.pins?.map((p) => `${p.component}:${p.pin}→${p.boardPin}`).join(", ") || "None configured"}
- BOM Items: ${projectContext.bomItems?.map((b) => b.name).join(", ") || "Empty"}
${historyContext}

The user wants to modify this project using natural language. Interpret their command and determine what operations need to be performed.

User command: "${userCommand}"

Return ONLY valid JSON matching this exact schema:
{
  "operations": [
    // Array of operations to perform. Each operation has a "type" field. Types:
    // { "type": "add_component", "component": "DHT22 temperature sensor", "description": "Digital humidity and temperature sensor" }
    // { "type": "remove_component", "component": "LED" }
    // { "type": "change_board", "newBoard": "ESP32-S3", "reason": "Need more GPIO pins" }
    // { "type": "modify_pin", "component": "DHT22", "oldPin": "GPIO2", "newPin": "GPIO4" }
    // { "type": "update_component", "component": "LED", "newSpecs": "Change to RGB LED with 3 pins" }
    // { "type": "change_code_language", "language": "C++", "framework": "Arduino" }
    // { "type": "regenerate_code" }  // Forces regeneration of the code skeleton
    // { "type": "explain_design", "aspect": "Why is the capacitor placed near the MCU?" }
    // { "type": "suggest_improvements" }
    // { "type": "add_feature", "feature": "Add a rotary encoder for input" }
    // { "type": "optimize_power" }
    // { "type": "check_compatibility" }
  ],
  "explanation": "A clear, concise explanation of what changes will be made and why",
  "warnings": ["Any potential issues or considerations"],
  "questions": ["Any clarifying questions to ask the user"],
  "regenerated": {
    "overview": true/false,    // Will this change require regenerating the project overview?
    "pinDiagram": true/false, // Will this change require regenerating the pin diagram?
    "schematic": true/false,   // Will this change require regenerating the schematic?
    "bom": true/false,         // Will this change require regenerating the BOM?
    "powerBudget": true/false, // Will this change require regenerating the power budget?
    "codeSkeleton": true/false // Will this change require regenerating the code?
  }
}

Rules:
1. Only include operations that are explicitly requested or clearly implied
2. For "add_component", always include a clear description of what the component does
3. For "explain_design", provide thoughtful technical explanations
4. Set regenerated fields to true for any section that would be affected by the changes
5. If the command is unclear, set "questions" to ask for clarification
6. If the command would cause issues (voltage mismatch, incompatible parts), include warnings
7. Be precise with component names and pin numbers
8. For code-related commands like "switch to MicroPython", "change to Arduino framework", or "rewrite the code", use "change_code_language" and set "codeSkeleton": true
9. For general code refresh requests like "regenerate code", "update code", or "fix the code", use "regenerate_code" and set "codeSkeleton": true
10. The "change_code_language" operation requires both "language" and "framework" fields

Return only JSON, no markdown or explanation.`;

  return generateJSON<NaturalLanguageEditResult>(prompt);
}
