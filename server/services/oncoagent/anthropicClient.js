import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
let client = null;

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente. Configure a chave no backend.");
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function callClaude({ system, user, maxTokens = 1400, temperature = 0.2 }) {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: "user", content: user }]
  });
  return response.content?.[0]?.text || "";
}
