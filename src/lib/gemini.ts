import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export function getGeminiModel() {
  return getGeminiClient().getGenerativeModel({
    model: "gemini-3.1-flash-lite",
  });
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
