import { Request, Response } from "express";
import OpenAI from "openai";
import { config } from "../config/env.js";
import { UCalgaryService } from "../services/ucalgary.service.js";
import { AHSService } from "../services/ahs.service.js";
import { StudentUnionService } from "../services/studentUnion.service.js";

const ucalgaryService = new UCalgaryService();
const ahsService = new AHSService();
const suService = new StudentUnionService();

type ResourceIntent =
  | "mental_health" | "physical_health" | "sexual_health" | "crisis"
  | "financial_aid" | "legal_help" | "campus_safety" | "food_security"
  | "housing" | "insurance" | "addiction" | "sexual_violence" | "general";

// ── Daily request counter for Cloudflare ─────────────────────────────────────
let cfRequestsToday = 0;
let cfCounterDate = new Date().toDateString();

function getCFRequestsToday(): number {
  const today = new Date().toDateString();
  if (today !== cfCounterDate) {
    cfRequestsToday = 0;
    cfCounterDate = today;
  }
  return cfRequestsToday;
}

function incrementCFCounter() {
  cfRequestsToday++;
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a compassionate support assistant for University of Calgary (UCalgary) students called ConnectAtlas.

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

// ── LLM caller ────────────────────────────────────────────────────────────────
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callCloudflareAI(messages: Message[], maxTokens = 1000): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/ai/run/${config.cloudflareModel}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.cloudflareApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare AI error ${response.status}: ${error}`);
  }

  const data = await response.json() as { result?: { response?: string }; success?: boolean };

  if (!data.success || !data.result?.response) {
    throw new Error("Empty or failed response from Cloudflare AI");
  }

  return data.result.response;
}

async function callOpenAI(messages: Message[], maxTokens = 1000): Promise<string> {
  const openai = new OpenAI({ apiKey: config.openaiApiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const reply = completion.choices[0].message.content;
  if (!reply) throw new Error("Empty response from OpenAI");
  return reply;
}

async function callLLM(messages: Message[], maxTokens = 1000): Promise<{ reply: string; provider: string }> {
  const cfConfigured = config.cloudflareAccountId && config.cloudflareApiToken;
  const cfLimitReached = getCFRequestsToday() >= config.cloudflareDailyLimit;

  // Try Cloudflare first if configured and under daily limit
  if (cfConfigured && !cfLimitReached) {
    try {
      console.log(`☁️  Using Cloudflare Workers AI (request ${getCFRequestsToday() + 1}/${config.cloudflareDailyLimit} today)`);
      const reply = await callCloudflareAI(messages, maxTokens);
      incrementCFCounter();
      return { reply, provider: "cloudflare" };
    } catch (error: any) {
      console.warn("⚠️  Cloudflare AI failed, falling back to OpenAI:", error.message);
    }
  } else if (cfLimitReached) {
    console.log(`📊 Cloudflare daily limit reached (${config.cloudflareDailyLimit}), using OpenAI`);
  }

  // Fall back to OpenAI
  if (!config.openaiApiKey) {
    throw new Error("No LLM available — set CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN or OPENAI_API_KEY");
  }

  console.log("🤖 Using OpenAI fallback");
  const reply = await callOpenAI(messages, maxTokens);
  return { reply, provider: "openai" };
}

// ── Controller ────────────────────────────────────────────────────────────────
export class ChatbotController {
  async chat(req: Request, res: Response) {
    try {
      const { message, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const intent = this.detectIntent(message);
      console.log("🎯 Intent:", intent);

      const { resources, usedSearch } = await this.resolveResources(intent, message);

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

      const { reply, provider } = await callLLM(messages);

      console.log(`✅ Response sent via ${provider}`);

      res.json({
        reply,
        intent,
        usedSearch,
        provider,
        cfRequestsToday: getCFRequestsToday(),
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

  // ── Intent detection ──────────────────────────────────────────────────────
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
      m.includes("sexual assault") || m.includes("sexual violence") ||
      m.includes("rape") || m.includes("survivor")
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
      m.includes("tuition") || m.includes("broke") || m.includes("scholarship") ||
      m.includes("emergency fund") || m.includes("hardship")
    ) return "financial_aid";

    if (
      m.includes("insurance") || m.includes("studentcare") || m.includes("health plan") ||
      m.includes("dental") || m.includes("coverage") || m.includes("benefits")
    ) return "insurance";

    if (
      m.includes("legal") || m.includes("lawyer") || m.includes("court") ||
      m.includes("law ") || m.includes("tenant") || m.includes("landlord") ||
      m.includes("evict") || m.includes("contract") || m.includes("criminal") ||
      m.includes("sue") || m.includes("rights")
    ) return "legal_help";

    if (
      m.includes("safe") || m.includes("danger") || m.includes("threat") ||
      m.includes("scared") || m.includes("stalking") || m.includes("campus security") ||
      m.includes("safe walk") || m.includes("violence") || m.includes("police")
    ) return "campus_safety";

    if (
      m.includes("housing") || m.includes("rent") || m.includes("apartment") ||
      m.includes("homeless") || m.includes("shelter") || m.includes("roommate") ||
      m.includes("lease")
    ) return "housing";

    if (
      m.includes("food") || m.includes("hungry") || m.includes("groceries") ||
      m.includes("meal") || m.includes("eat") || m.includes("food bank") ||
      m.includes("starving")
    ) return "food_security";

    return "general";
  }

  // ── Resource resolution ───────────────────────────────────────────────────
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

  private async searchForResources(message: string): Promise<{ resources: any; usedSearch: boolean }> {
    try {
      const { reply } = await callLLM([
        {
          role: "system",
          content: "You are a resource finder for UCalgary students. Given a student's problem, find the most relevant UCalgary, AHS, or Calgary-area support resources. Return ONLY a valid JSON object with resource names, phone numbers, and websites. No extra text.",
        },
        {
          role: "user",
          content: `Find relevant resources for a UCalgary student with this issue: "${message}"`,
        },
      ], 400);

      try {
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        const resources = jsonMatch ? JSON.parse(jsonMatch[0]) : { note: reply };
        return { resources, usedSearch: true };
      } catch {
        return { resources: { note: reply }, usedSearch: true };
      }
    } catch (error) {
      console.error("Search fallback failed:", error);
      return { resources: null, usedSearch: false };
    }
  }
}