import OpenAI from "openai";

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI | undefined {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  client ??= new OpenAI({ apiKey });
  return client;
}
