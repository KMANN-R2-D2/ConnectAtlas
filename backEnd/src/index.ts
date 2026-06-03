import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import resourceRoutes from "./routes/resources.routes.js";

const app = express();

// Trust proxy — required for express-rate-limit to work correctly on Render
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    "https://connectatlas.onrender.com",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());

// Rate limiting
app.use("/api/", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "ConnectAtlas API",
    version: "2.0.0",
    status: "running",
    endpoints: {
      chatbot: "/api/chat",
      resources: "/api/resources",
      health: "/api/health",
    },
  });
});

app.use("/api/chat", chatbotRoutes);
app.use("/api/resources", resourceRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get("/api/status", (req, res) => {
  const usingCloudflare = !!(config.cloudflareAccountId && config.cloudflareApiToken);
  res.json({
    provider: usingCloudflare ? "cloudflare" : "openai",
    model: usingCloudflare ? config.cloudflareModel : "gpt-4o-mini",
  });
});

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🔑 OpenAI API Key: ${config.openaiApiKey ? "Configured" : "Missing"}`);
});