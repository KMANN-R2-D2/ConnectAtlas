import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  ollamaUrl: process.env.OLLAMA_URL || "",
  ollamaModel: process.env.OLLAMA_MODEL || "gemma3:4b",

  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMaxRequests: 100,
};

// Validate — at least one LLM must be configured
if (!config.ollamaUrl && !config.openaiApiKey) {
  console.warn("⚠️ WARNING: Neither OLLAMA_URL nor OPENAI_API_KEY is set! Chat will not work.");
} else if (config.ollamaUrl) {
  console.log(`🦙 Ollama configured: ${config.ollamaUrl} (model: ${config.ollamaModel})`);
} else {
  console.log("🤖 Using OpenAI fallback");
}