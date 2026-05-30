import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",

  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMaxRequests: 100,
};

if (!config.openaiApiKey) {
  console.warn("⚠️ WARNING: OPENAI_API_KEY is not set!");
}