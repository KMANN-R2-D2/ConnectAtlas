import { Request, Response } from "express";
import { config } from "../config/env.js";
import { UCalgaryService } from "../services/ucalgary.service.js";
import { AHSService } from "../services/ahs.service.js";
import { StudentUnionService } from "../services/studentUnion.service.js";

const ucalgaryService = new UCalgaryService();
const ahsService = new AHSService();
const suService = new StudentUnionService();

// ─── Intent → hard-coded resource category map ───────────────────────────────

const RESOURCE_INTENTS = [
  "mental_health",
  "physical_health",
  "sexual_health",
  "crisis",
  "financial_aid",
  "legal_help",
  "campus_safety",
  "food_security",
  "housing",
  "insurance",
  "addiction",
  "sexual_violence",
] as const;

type ResourceIntent = (typeof RESOURCE_INTENTS)[number] | "general" | "unknown";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a compassionate support assistant for University of Calgary (UCalgary) students.

Your role:
1. Provide accurate, empathetic responses to students facing health, financial, legal, safety, or personal challenges.
2. Direct students to the most relevant UCalgary, AHS, or Student Union resources.
3. NEVER diagnose illness or replace professional medical, legal, or financial advice.
4. Be warm, non-judgmental, and give concrete next steps.

When resources are provided in context, reference them specifically (names, phone numbers, websites).
If the student seems to be in crisis, always prioritize safety resources first.

Key always-available emergency numbers:
- Campus Security: 403-220-5333 (24/7)
- Distress Centre: 403-266-4357 (24/7)
- Suicide/Crisis Line: 988 (24/7, call or text)
- Emergency: 911`;

// ─── LLM caller — tries Ollama first, falls back to OpenAI ───────────────────

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callLLM(messages: Message[], maxTokens = 1000): Promise<string> {
  const ollamaUrl = config.ollamaUrl;

  // Try Ollama first if configured
  if (ollamaUrl) {
    try {
      console.log("🤖 Trying Ollama...");
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.ollamaModel || "gemma3:4b",
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status ${response.status}`);
      }

      const data = await response.json() as { message?: { content?: string } };
      const reply = data.message?.content;

      if (!reply) throw new Error("Empty response from Ollama");

      console.log("✅ Ollama responded successfully");
      return reply;
    } catch (error: any) {
      console.warn("⚠️ Ollama unavailable, falling back to OpenAI:", error.message);
    }
  }

  // Fall back to OpenAI
  if (!config.openaiApiKey) {
    throw new Error("Neither Ollama nor OpenAI is configured");
  }

  console.log("🤖 Using OpenAI fallback...");
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: config.openaiApiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const reply = completion.choices[0].message.content;
  if (!reply) throw new Error("Empty response from OpenAI");

  console.log("✅ OpenAI responded successfully");
  return reply;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class ChatbotController {
  async chat(req: Request, res: Response) {
    try {
      const { message, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!config.ollamaUrl && !config.openaiApiKey) {
        return res.status(500).json({ error: "No LLM configured. Set OLLAMA_URL or OPENAI_API_KEY." });
      }

      const intent = this.detectIntent(message);
      console.log("🎯 Intent:", intent);

      const { resources, usedSearch } = await this.resolveResources(intent, message);
      console.log(`📚 Resources resolved (search used: ${usedSearch})`);

      const messages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      if (resources) {
        messages.push({
          role: "system",
          content: `Relevant resources for this student's issue:\n${JSON.stringify(resources, null, 2)}`,
        });
      }

      if (conversationHistory && Array.isArray(conversationHistory)) {
        messages.push(...conversationHistory);
      }

      messages.push({ role: "user", content: message });

      const reply = await callLLM(messages);

      res.json({
        reply,
        intent,
        usedSearch,
        resources,
        conversationHistory: [
          ...messages.slice(resources ? 2 : 1).filter((m) => m.role !== "system"),
          { role: "assistant", content: reply },
        ],
      });
    } catch (error: any) {
      console.error("❌ Chat error:", error);

      if (error.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
      }
      if (error.status === 401) {
        return res.status(500).json({ error: "API authentication failed." });
      }
      if (error.code === "insufficient_quota") {
        return res.status(500).json({ error: "OpenAI account has insufficient credits." });
      }

      res.status(500).json({ error: "Failed to process chat request", details: error.message });
    }
  }

  // ─── Intent detection ───────────────────────────────────────────────────────

  private detectIntent(message: string): ResourceIntent {
    const m = message.toLowerCase();

    if (
      m.includes("suicid") || m.includes("kill myself") || m.includes("end my life") ||
      m.includes("hurt myself") || m.includes("self-harm") || m.includes("crisis") ||
      m.includes("overdose")
    ) return "crisis";

    if (
      m.includes("anxious") || m.includes("anxiety") || m.includes("depressed") ||
      m.includes("depression") || m.includes("overwhelmed") || m.includes("mental health") ||
      m.includes("counsell") || m.includes("therapy") || m.includes("therapist") ||
      m.includes("stress") || m.includes("burnout") || m.includes("loneli") ||
      m.includes("panic attack") || m.includes("ptsd") || m.includes("trauma")
    ) return "mental_health";

    if (
      m.includes("addiction") || m.includes("substance") || m.includes("alcohol") ||
      m.includes("drugs") || m.includes("drinking") || m.includes("recovery")
    ) return "addiction";

    if (
      m.includes("sexual assault") || m.includes("sexual violence") || m.includes("harassment") ||
      m.includes("assault") || m.includes("rape") || m.includes("survivor")
    ) return "sexual_violence";

    if (
      m.includes("sti") || m.includes("std") || m.includes("birth control") ||
      m.includes("sexual health") || m.includes("condom") || m.includes("pregnancy") ||
      m.includes("contraception")
    ) return "sexual_health";

    if (
      m.includes("sick") || m.includes("fever") || m.includes("cold") || m.includes("flu") ||
      m.includes("doctor") || m.includes("prescription") || m.includes("vaccine") ||
      m.includes("medical") || m.includes("injury") || m.includes("pain") ||
      m.includes("health clinic") || m.includes("walk-in")
    ) return "physical_health";

    if (
      m.includes("financ") || m.includes("money") || m.includes("afford") ||
      m.includes("bursary") || m.includes("loan") || m.includes("debt") ||
      m.includes("tuition") || m.includes("broke") || m.includes("poor") ||
      m.includes("scholarship") || m.includes("emergency fund") || m.includes("hardship")
    ) return "financial_aid";

    if (
      m.includes("insurance") || m.includes("studentcare") || m.includes("health plan") ||
      m.includes("dental") || m.includes("coverage") || m.includes("benefits")
    ) return "insurance";

    if (
      m.includes("legal") || m.includes("lawyer") || m.includes("court") ||
      m.includes("law ") || m.includes("tenant") || m.includes("landlord") ||
      m.includes("evict") || m.includes("contract") || m.includes("criminal") ||
      m.includes("immigration") || m.includes("sue") || m.includes("rights")
    ) return "legal_help";

    if (
      m.includes("safe") || m.includes("danger") || m.includes("threat") ||
      m.includes("scared") || m.includes("stalking") || m.includes("follow") ||
      m.includes("campus security") || m.includes("safe walk") || m.includes("violence") ||
      m.includes("police")
    ) return "campus_safety";

    if (
      m.includes("housing") || m.includes("rent") || m.includes("apartment") ||
      m.includes("evict") || m.includes("homeless") || m.includes("shelter") ||
      m.includes("roommate") || m.includes("landlord") || m.includes("lease")
    ) return "housing";

    if (
      m.includes("food") || m.includes("hungry") || m.includes("groceries") ||
      m.includes("meal") || m.includes("eat") || m.includes("food bank") ||
      m.includes("food insecurity") || m.includes("starving")
    ) return "food_security";

    return "general";
  }

  // ─── Resource resolution ────────────────────────────────────────────────────

  private async resolveResources(
    intent: ResourceIntent,
    message: string
  ): Promise<{ resources: any; usedSearch: boolean }> {
    try {
      const ucWellness = ucalgaryService.getWellnessResourcesStatic();
      const ucGeneral = ucalgaryService.getGeneralResourcesStatic();
      const suWellness = suService.getWellnessResources();
      const suGeneral = suService.getGeneralResources();
      const ahs = ahsService.getResources();

      switch (intent) {
        case "crisis":
          return {
            usedSearch: false,
            resources: {
              emergency: "911",
              campusSecurity: ucWellness.campusSecurity,
              distressCentre: ahs.distressCentre,
              suicideLine: ahs.suicideCrisisHelpline,
              mentalHealthLine: ahs.mentalHealthHelpLine,
              wellnessCentre: ucWellness.mentalHealth,
            },
          };

        case "mental_health":
          return {
            usedSearch: false,
            resources: {
              wellnessCentre: ucWellness.mentalHealth,
              peerSupport: suWellness.peerSupport,
              insurance: suWellness.insurance,
              distressCentre: ahs.distressCentre,
              mentalHealthLine: ahs.mentalHealthHelpLine,
            },
          };

        case "addiction":
          return {
            usedSearch: false,
            resources: {
              wellnessCentre: ucWellness.mentalHealth,
              addictionLine: ahs.addictionHelpLine,
              distressCentre: ahs.distressCentre,
            },
          };

        case "sexual_violence":
          return {
            usedSearch: false,
            resources: {
              sexualViolenceSupport: ucWellness.sexualViolenceSupport,
              campusSecurity: ucWellness.campusSecurity,
              distressCentre: ahs.distressCentre,
            },
          };

        case "sexual_health":
          return {
            usedSearch: false,
            resources: {
              medicalClinic: ucWellness.medicalClinic,
              calgaryFamilyServices: ahs.calgaryFamilyServices,
            },
          };

        case "physical_health":
          return {
            usedSearch: false,
            resources: {
              medicalClinic: ucWellness.medicalClinic,
              healthLink: ahs.healthLink,
              urgentCare: ahs.urgentCare,
            },
          };

        case "financial_aid":
          return {
            usedSearch: false,
            resources: {
              ucalgaryEmergencyAid: ucGeneral.financialAid,
              suHardshipFund: suGeneral.hardshipFund,
              urgentSupport: ucGeneral.urgentSupport,
            },
          };

        case "insurance":
          return {
            usedSearch: false,
            resources: {
              studentCare: suWellness.insurance,
              wellnessFreeServices: {
                note: "UCalgary Student Wellness Services counselling is FREE — no insurance needed",
                phone: ucWellness.mentalHealth.phone,
                website: ucWellness.mentalHealth.website,
              },
            },
          };

        case "legal_help":
          return {
            usedSearch: false,
            resources: {
              legalHelp: ucGeneral.legalHelp,
              advocacy: suGeneral.advocacy,
            },
          };

        case "campus_safety":
          return {
            usedSearch: false,
            resources: {
              campusSafety: ucGeneral.campusSafety,
              campusSecurity: ucWellness.campusSecurity,
            },
          };

        case "housing":
          return {
            usedSearch: false,
            resources: {
              housingHelp: ucGeneral.housingHelp,
              offCampusHousing: suGeneral.offCampusHousing,
            },
          };

        case "food_security":
          return {
            usedSearch: false,
            resources: {
              foodBank: suGeneral.foodBank,
              foodHub: ucGeneral.foodSecurity,
              denMeals: suGeneral.denAffordableMeals,
            },
          };

        case "general":
          return {
            usedSearch: false,
            resources: {
              wellnessCentre: { phone: ucWellness.mentalHealth.phone, website: ucWellness.mentalHealth.website },
              urgentSupport: ucGeneral.urgentSupport,
              campusSecurity: ucWellness.campusSecurity,
            },
          };

        default:
          return await this.searchForResources(message);
      }
    } catch (error) {
      console.error("Error resolving resources:", error);
      return { resources: null, usedSearch: false };
    }
  }

  // ─── AI search fallback for unknown intents ───────────────────────────────

  private async searchForResources(
    message: string
  ): Promise<{ resources: any; usedSearch: boolean }> {
    try {
      const content = await callLLM([
        {
          role: "system",
          content:
            "You are a resource finder for UCalgary students. Given a student's problem, find the most relevant UCalgary, AHS, or Calgary-area support resources. Return ONLY a valid JSON object with resource names, phone numbers, and websites. No extra text.",
        },
        {
          role: "user",
          content: `Find relevant resources for a UCalgary student with this issue: "${message}"`,
        },
      ], 400);

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const resources = jsonMatch ? JSON.parse(jsonMatch[0]) : { note: content };
        return { resources, usedSearch: true };
      } catch {
        return { resources: { note: content }, usedSearch: true };
      }
    } catch (error) {
      console.error("Search fallback failed:", error);
      return { resources: null, usedSearch: false };
    }
  }
}