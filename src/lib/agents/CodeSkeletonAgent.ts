import { generateJSON } from "../gemini";
import { CodeSkeleton } from "../types";

export async function CodeSkeletonAgent(
  board: string,
  components: string[],
  pins: Array<{
    component: string;
    pin: string;
    boardPin: string;
    signalType: string;
  }>,
  preferredLanguage?: "C++" | "MicroPython",
  preferredFramework?: "Arduino" | "ESP-IDF" | "STM32 HAL",
): Promise<CodeSkeleton> {
  const pinDefs = pins
    .filter((p) => !["power", "ground"].includes(p.signalType))
    .slice(0, 20)
    .map((p) => `// ${p.component} ${p.pin} -> ${p.boardPin}`)
    .join("\n");

  // Determine language and framework, using preferences if provided
  const detectFramework = (): "Arduino" | "ESP-IDF" | "STM32 HAL" => {
    if (preferredFramework) return preferredFramework;
    if (board.startsWith("Arduino")) return "Arduino";
    if (board.startsWith("ESP32")) return "Arduino";
    return "STM32 HAL";
  };

  const detectLanguage = (): "C++" | "MicroPython" => {
    if (preferredLanguage) return preferredLanguage;
    // Default to C++ for most boards
    return "C++";
  };

  const language = detectLanguage();
  const framework = detectFramework();

  const prompt = `You are an expert embedded systems programmer. Generate a complete code skeleton for this project.

Board: ${board}
Framework: ${framework}
Components: ${components.join(", ")}

Pin definitions:
${pinDefs}

Generate a well-commented ${language} code skeleton using the ${framework} framework.
Include:
- Tend to cut down on unnecessary code comments
- All necessary #include statements with library names
- Pin constant definitions with actual pin numbers
- Object/variable declarations for each component
- setup() function with initialization code for each component
- loop() function with basic read/process/output logic
- Helper functions with TODO comments where user should implement logic
- Error handling where appropriate
- If possible, always keep the code simple and readable.
- Before writing the code, always think about the overall architecture, complexity, and requirements.

The code should compile without errors if the libraries are installed.
Use realistic pin numbers from the pin assignments above.

Return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "language": "${language}",
  "framework": "${framework}",
  "code": "// complete code skeleton as a single string with \\n for newlines"
}

Return only JSON.`;

  return generateJSON<CodeSkeleton>(prompt);
}
