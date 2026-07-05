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

  const detectFramework = (): "Arduino" | "ESP-IDF" | "STM32 HAL" => {
    if (preferredFramework) return preferredFramework;
    if (board.startsWith("Arduino")) return "Arduino";
    if (board.startsWith("ESP32")) return "Arduino";
    return "STM32 HAL";
  };

  const detectLanguage = (): "C++" | "MicroPython" => {
    if (preferredLanguage) return preferredLanguage;

    return "C++";
  };

  const language = detectLanguage();
  const framework = detectFramework();

  import { BASE_PROMPT } from "./promptBase";

  const example = {
    language: "C++",
    framework: "Arduino",
    code: "#include <Arduino.h>\n\n// Pin definitions\nconst int LED_PIN = 2;\n\nvoid setup() {\n  pinMode(LED_PIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH);\n  delay(500);\n  digitalWrite(LED_PIN, LOW);\n  delay(500);\n}\n",
  };

  const prompt = `${BASE_PROMPT}\n\nBoard: ${board}\nFramework: ${framework}\nComponents: ${components.join(", ")}\n\nPin definitions:\n${pinDefs}\n\nGenerate a well‑commented ${language} code skeleton using the ${framework} framework. Include necessary includes, pin constants, setup(), loop(), and placeholder helper functions.\n\nExample output:\n${JSON.stringify(example)}`;

  return generateJSON<CodeSkeleton>(prompt);
}
