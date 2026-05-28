import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import resourceRoutes from "./routes/resources.routes.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'https://your-frontend-url.onrender.com'
}))
app.use(express.json());

// Rate limiting
app.use("/api/", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "UofC Healthcare Assistant API",
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Error handling
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🔑 OpenAI API Key: ${config.openaiApiKey ? "Configured" : "Missing"}`);
});