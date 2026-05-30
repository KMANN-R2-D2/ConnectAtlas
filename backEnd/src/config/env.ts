import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",

  // Cloudflare Workers AI
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || "",
  cloudflareModel: "@cf/google/gemma-4-26b-a4b-it",
  cloudflareDailyLimit: 300,

  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMaxRequests: 100,
};

if (!config.openaiApiKey) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY is not set!");
}
if (!config.cloudflareAccountId || !config.cloudflareApiToken) {
  console.warn("⚠️  WARNING: Cloudflare Workers AI is not configured — all requests will use OpenAI.");
} else {
  console.log(`☁️  Cloudflare Workers AI configured (model: ${config.cloudflareModel}, daily limit: ${config.cloudflareDailyLimit})`);
}