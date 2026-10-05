import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ZodType } from "zod";

let client: GoogleGenerativeAI | null = null;

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 60_000;
const MAX_ATTEMPTS = 2;

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
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });
}

function cleanJSONText(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function generateJSON<T>(
  prompt: string,
  schema?: ZodType<T>,
): Promise<T> {
  const model = getGeminiModel();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const finalPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nYour previous response was invalid${
            lastError instanceof Error ? `: ${lastError.message}` : ""
          }. Return ONLY a single valid raw JSON object with no extra text.`;

    let text: string;
    try {
      const result = await model.generateContent(finalPrompt, {
        timeout: TIMEOUT_MS,
      });
      text = result.response.text().trim();
    } catch (e) {
      lastError =
        e instanceof Error && /timeout/i.test(e.message)
          ? new Error(`model request timed out after ${TIMEOUT_MS}ms`)
          : e;
      continue;
    }

    if (!text || text.length > 500_000) {
      lastError = new Error("empty or oversized response");
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(cleanJSONText(text));
      return schema ? schema.parse(parsed) : (parsed as T);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(
    `Failed to get valid JSON from model after ${MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : "unknown error"
    }`,
  );
}
