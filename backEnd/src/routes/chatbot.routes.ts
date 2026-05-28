import express from "express";
import { ChatbotController } from "../controllers/chatbot.controller.js";

const router = express.Router();
const controller = new ChatbotController();

router.post("/", (req, res) => controller.chat(req, res));

export default router;