export interface Resource {
  name?: string
  title?: string
  phone?: string
  website?: string
  url?: string
  link?: string
  description?: string
  available?: string
  hours?: string
  location?: string
  email?: string
  text?: string
  note?: string
}

export interface ChatResponse {
  reply: string
  intent: string
  provider: string        // add this
  usedSearch: boolean
  resources: Record<string, Resource | Resource[] | string> | null
  conversationHistory: { role: string; content: string }[]
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function sendMessage(
  message: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<ChatResponse> {
  // Fallback mock if no backend
  if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
    return {
      reply: "Mock response: backend not connected yet.",
      intent: "general",
      provider: "mock",
      usedSearch: false,
      resources: null,
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: "Mock response: backend not connected yet." }
      ]
    }
  }

  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error: ${res.status}`)
  }

  return res.json()
}

// ── Resource panel data fetchers ──────────────────────────────────────────────

export interface HealthWellnessData {
  ucalgary: {
    mentalHealth: Resource & { services?: string[]; bookingInfo?: string }
    medicalClinic: Resource & { services?: string[] }
    sexualViolenceSupport: Resource
    campusSecurity: Resource & { safeWalk?: string; nonEmergencyReport?: string }
  }
  studentUnion: {
    insurance: {
      name: string; website: string; phone: string
      coverage: Record<string, string>; note?: string
    }
    peerSupport: Resource & { services?: string[] }
    qCentre: Resource
  }
  ahs: {
    healthLink: Resource & { whenToCall?: string[] }
    mentalHealthHelpLine: Resource
    addictionHelpLine: Resource
    distressCentre: Resource
    suicideCrisisHelpline: Resource
    urgentCare: (Resource & { address?: string; services?: string[] })[]
    emergencyRooms: (Resource & { address?: string; note?: string })[]
    calgaryFamilyServices: Resource & { address?: string; services?: string[] }
  }
}

export interface GeneralResourcesData {
  ucalgary: {
    financialAid: { category: string; resources: (Resource & { howToApply?: string; turnaround?: string })[] }
    legalHelp: { category: string; resources: Resource[] }
    campusSafety: { category: string; resources: (Resource & { address?: string; safeWalk?: string; onlineReport?: string; emergency?: string; altPhone?: string })[] }
    housingHelp: { category: string; resources: Resource[] }
    foodSecurity: { category: string; resources: Resource[] }
    urgentSupport: { category: string; description: string; website: string }
  }
  studentUnion: {
    hardshipFund: Resource & { eligibility?: string[]; howToApply?: string; turnaround?: string; email?: string }
    foodBank: Resource & { services?: string[] }
    advocacy: Resource
    offCampusHousing: Resource
    denAffordableMeals: Resource
  }
}

export async function fetchHealthWellness(): Promise<HealthWellnessData> {
  const res = await fetch(`${API_URL}/api/resources/health-wellness`)
  if (!res.ok) throw new Error('Failed to fetch health & wellness resources')
  return res.json()
}

export async function fetchGeneralResources(): Promise<GeneralResourcesData> {
  const res = await fetch(`${API_URL}/api/resources/general`)
  if (!res.ok) throw new Error('Failed to fetch general resources')
  return res.json()
}