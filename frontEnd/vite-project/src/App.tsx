import { useState, useRef, useEffect } from 'react'
import { sendMessage } from './api/chat'
import type { Resource } from './api/chat'
import ReactMarkdown from 'react-markdown'
import './App.css'

type View = 'chat' | 'health' | 'resources'

interface Message {
  role: 'user' | 'assistant'
  text: string
  resources?: Record<string, Resource | Resource[] | string> | null
}

// ── Static panel data ──────────────────────────────────────────────────────────

const healthUCalgary = [
  {
    name: "Student Wellness Services – Mental Health",
    badge: { label: "Free", color: "green" },
    desc: "Free short-term counselling, crisis support, group therapy and wellness workshops for UCalgary students.",
    phone: "403-210-9355",
    email: "wellness@ucalgary.ca",
    location: "MacEwan Student Centre, Room 370",
    hours: "Mon–Fri, 8:30 AM – 4:30 PM",
    services: ["Free short-term counselling (up to 10 sessions)", "Crisis support", "Group therapy", "Wellness workshops"],
    website: "https://www.ucalgary.ca/wellness-services/services/mental-health-services",
  },
  {
    name: "Student Medical Clinic",
    badge: { label: "Walk-in", color: "blue" },
    desc: "Walk-in medical care including STI testing, birth control counselling, vaccinations and prescription renewals.",
    phone: "403-210-9355",
    location: "MacEwan Student Centre, Room 370",
    hours: "Mon–Fri, 9:00 AM – 4:00 PM",
    services: ["Walk-in appointments", "STI testing & treatment", "Birth control counselling", "Vaccinations", "Prescription renewals"],
    website: "https://www.ucalgary.ca/wellness-services/services/medical-services",
  },
  {
    name: "SU Peer Support Centre",
    badge: { label: "Free", color: "green" },
    desc: "Free, confidential one-on-one and group peer support for any student challenge.",
    services: ["One-on-one peer support", "Group sessions", "Academic stress support"],
    website: "https://www.su.ucalgary.ca/programs-services/student-support/peer-support/",
  },
]

const healthAHS = [
  {
    name: "Health Link 811",
    badge: { label: "24/7", color: "green" },
    desc: "Speak with a registered nurse anytime for health advice and guidance on whether to seek further care.",
    phone: "811",
    website: "https://www.albertahealthservices.ca/assets/healthinfo/link/index.html",
  },
  {
    name: "Mental Health Help Line",
    badge: { label: "24/7", color: "green" },
    desc: "24/7 mental health support and crisis intervention from Alberta Health Services.",
    phone: "1-877-303-2642",
  },
  {
    name: "Addiction Help Line",
    badge: { label: "24/7", color: "green" },
    desc: "24/7 confidential support for substance use concerns.",
    phone: "1-866-332-2322",
  },
  {
    name: "Distress Centre Calgary",
    badge: { label: "24/7", color: "green" },
    desc: "24/7 crisis support and suicide prevention for Calgary residents.",
    phone: "403-266-4357",
    website: "https://www.distresscentre.com",
  },
  {
    name: "Sheldon M. Chumir Health Centre",
    badge: { label: "Urgent Care", color: "orange" },
    desc: "Closest urgent care to campus. Handles urgent care and mental health crisis support.",
    phone: "403-955-6200",
    location: "1213 4 St SW, Calgary",
    hours: "24/7",
  },
  {
    name: "Foothills Medical Centre (ER)",
    badge: { label: "Emergency", color: "pink" },
    desc: "Closest emergency room to UCalgary main campus.",
    phone: "403-944-1110",
    location: "1403 29 St NW, Calgary",
  },
]

const resourcesFinancial = [
  {
    name: "Student Financial Aid & Awards",
    badge: { label: "UCalgary", color: "blue" },
    desc: "Government student loans, bursaries, scholarships, emergency financial assistance, and tuition payment plans.",
    phone: "403-210-7625",
    location: "Hunter Student Commons, Room 220",
    services: ["Government student loans (Alberta Student Aid)", "UCalgary bursaries", "Emergency financial assistance", "Scholarships & awards", "Tuition payment plans"],
    website: "https://www.ucalgary.ca/registrar/finances/financial-aid",
  },
  {
    name: "SU Food Bank",
    badge: { label: "Free · No ID", color: "green" },
    desc: "Free groceries for students. No ID required, completely confidential. No questions asked.",
    location: "MacEwan Student Centre, Room 251",
    hours: "Mon–Fri, 10:00 AM – 4:00 PM",
    website: "https://www.su.ucalgary.ca/programs-services/student-support/food-bank/",
  },
  {
    name: "StudentCare Health & Dental Plan",
    badge: { label: "SU Insurance", color: "blue" },
    desc: "Student insurance: up to $1,500/yr mental health · 80% dental · $200 vision · 80% prescriptions.",
    phone: "1-866-369-2800",
    website: "https://www.studentcare.ca/rte/en/UniversityofCalgaryStudentsUnion_Home",
  },
]

const resourcesLegal = [
  {
    name: "Student Legal Assistance (SLA)",
    badge: { label: "Free / Pro Bono", color: "green" },
    desc: "Free legal help from UCalgary law students supervised by lawyers. Civil, criminal and family law matters.",
    phone: "403-220-6637",
    location: "Murray Fraser Hall (MFH) 3390",
    website: "https://slacalgary.com/",
  },
  {
    name: "Student Ombuds Office",
    badge: { label: "Confidential", color: "blue" },
    desc: "Confidential, impartial support for academic disputes, conflict resolution and navigating university policies.",
    website: "https://www.ucalgary.ca/student-services/ombuds",
  },
  {
    name: "SU Student Advocacy",
    badge: { label: "Free", color: "green" },
    desc: "Free support for academic appeals, grade disputes and protecting your student rights.",
    phone: "403-220-6551",
    website: "https://www.su.ucalgary.ca/programs-services/student-support/student-advocacy/",
  },
]

const resourcesSafety = [
  {
    name: "Campus Security & Protective Services",
    badge: { label: "24/7", color: "green" },
    desc: "Emergency response, Safe Walk program, and general campus safety. Call for a Safe Walk escort at any time.",
    phone: "403-220-5333",
    website: "https://www.ucalgary.ca/security",
  },
  {
    name: "Sexual & Gender-Based Violence Support Office",
    badge: { label: "Confidential", color: "blue" },
    desc: "Confidential support, safety planning, and reporting guidance for anyone affected by sexual or gender-based violence.",
    email: "sgbv@ucalgary.ca",
    location: "MacEwan Student Centre, MSC 452",
    website: "https://www.ucalgary.ca/sexual-violence-support",
  },
  {
    name: "Office of Diversity, Equity & Protected Disclosure",
    badge: { label: "UCalgary", color: "blue" },
    desc: "Handles discrimination, harassment and human rights complaints on campus.",
    phone: "403-220-4086",
  },
]

const resourcesAcademic = [
  {
    name: "Chancellor Cuthbertson Student Success Centre",
    badge: { label: "UCalgary", color: "blue" },
    desc: "Academic advising, writing assistance, tutoring and study skills workshops.",
    phone: "403-220-5881",
    website: "https://www.ucalgary.ca/student-services/student-success",
  },
  {
    name: "Student Accessibility Services",
    badge: { label: "UCalgary", color: "blue" },
    desc: "Accommodations and support for students with disabilities or accessibility needs.",
    phone: "403-220-8237",
    email: "access@ucalgary.ca",
    location: "MacEwan Student Centre, MSC 452",
    website: "https://www.ucalgary.ca/student-services/access",
  },
  {
    name: "Office of the Registrar",
    badge: { label: "UCalgary", color: "blue" },
    desc: "Enrolment, course registration, fee payments, transcripts and convocation.",
    website: "https://www.ucalgary.ca/registrar",
  },
]

const resourcesDiversity = [
  {
    name: "Women's Resource Centre",
    badge: { label: "UCalgary", color: "pink" },
    desc: "Support, programming and advocacy for women and gender-diverse students.",
    phone: "403-220-8550",
  },
  {
    name: "Q – SU Centre for Sexual and Gender Diversity",
    badge: { label: "SU", color: "pink" },
    desc: "Safe space and support for LGBTQ2S+ students at UCalgary.",
    phone: "403-220-4460",
    website: "https://www.su.ucalgary.ca/programs-services/student-support/q-centre/",
  },
  {
    name: "Writing Symbols Lodge",
    badge: { label: "UCalgary", color: "orange" },
    desc: "Academic, personal and cultural support for First Nations, Métis, and Inuit students.",
    phone: "403-220-6034",
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

const LogoSVG = () => (
  <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FC3F7" />
        <stop offset="50%" stopColor="#F06292" />
        <stop offset="100%" stopColor="#FFB74D" />
      </linearGradient>
    </defs>
    <path d="M50 85 C50 85 10 58 10 32 C10 18 21 8 35 8 C42 8 48 12 50 16 C52 12 58 8 65 8 C79 8 90 18 90 32 C90 58 50 85 50 85Z" fill="url(#heartGrad)" />
    <rect x="28" y="28" width="44" height="26" rx="13" fill="white" opacity="0.95"/>
    <circle cx="39" cy="41" r="6" fill="#4FC3F7"/><circle cx="61" cy="41" r="6" fill="#4FC3F7"/>
    <circle cx="39" cy="41" r="3" fill="white"/><circle cx="61" cy="41" r="3" fill="white"/>
    <path d="M47 58 L50 63 L53 58" fill="white" opacity="0.95"/>
  </svg>
)

const TypingDots = () => (
  <div className="typing-dots"><span /><span /><span /></div>
)

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

interface CardData {
  name: string
  badge?: { label: string; color: string }
  desc?: string
  phone?: string
  email?: string
  location?: string
  hours?: string
  services?: string[]
  website?: string
  note?: string
}

const badgeClass: Record<string, string> = {
  blue: 'rc-badge--blue',
  pink: 'rc-badge--pink',
  orange: 'rc-badge--orange',
  green: 'rc-badge--green',
}

const ResourceCard = ({ card }: { card: CardData }) => (
  <div className="resource-card">
    <div className="rc-header">
      <div className="rc-name">{card.name}</div>
      {card.badge && (
        <span className={`rc-badge ${badgeClass[card.badge.color] ?? 'rc-badge--blue'}`}>
          {card.badge.label}
        </span>
      )}
    </div>
    {card.desc && <div className="rc-desc">{card.desc}</div>}
    {card.services && (
      <ul className="rc-services">
        {card.services.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    )}
    {card.note && <div className="rc-note">{card.note}</div>}
    <div className="rc-meta">
      {card.hours && <span className={`rc-pill ${card.hours === '24/7' ? 'rc-pill--green' : ''}`}>🕐 {card.hours}</span>}
      {card.location && <span className="rc-pill">📍 {card.location}</span>}
    </div>
    <div className="rc-actions">
      {card.phone && (
        <a href={`tel:${card.phone}`} className="rc-action rc-action--phone">📞 {card.phone}</a>
      )}
      {card.email && (
        <a href={`mailto:${card.email}`} className="rc-action rc-action--email">✉️ {card.email}</a>
      )}
      {card.website && (
        <a href={card.website} target="_blank" rel="noopener noreferrer" className="rc-action rc-action--web">🌐 Visit website</a>
      )}
    </div>
  </div>
)

const SectionHeading = ({ emoji, title }: { emoji: string; title: string }) => (
  <div className="panel-section-heading">{emoji} {title}</div>
)

const HealthPanel = () => (
  <div className="info-panel">
    <div className="panel-hero">
      <div className="panel-hero-emoji">🏥</div>
      <div>
        <div className="panel-hero-title">Health & Wellness</div>
        <div className="panel-hero-sub">Campus health services and provincial support lines for UCalgary students</div>
      </div>
    </div>

    <div className="panel-urgent-banner">
      <span>🚨</span>
      <div>
        <strong>In an emergency, call 911</strong>
        <p>For on-campus emergencies, Campus Security is available 24/7 at <a href="tel:403-220-5333">403-220-5333</a>. Mental Health crisis line: <a href="tel:1-877-303-2642">1-877-303-2642</a>.</p>
      </div>
    </div>

    <SectionHeading emoji="🎓" title="UCalgary Services" />
    {healthUCalgary.map((c, i) => <ResourceCard key={i} card={c} />)}

    <SectionHeading emoji="🏛️" title="Alberta Health Services" />
    {healthAHS.map((c, i) => <ResourceCard key={i} card={c} />)}
  </div>
)

const ResourcesPanel = () => (
  <div className="info-panel">
    <div className="panel-hero">
      <div className="panel-hero-emoji">📚</div>
      <div>
        <div className="panel-hero-title">Student Resources</div>
        <div className="panel-hero-sub">Financial, legal, safety, academic, and diversity support for UCalgary students</div>
      </div>
    </div>

    <SectionHeading emoji="💰" title="Financial Support" />
    {resourcesFinancial.map((c, i) => <ResourceCard key={i} card={c} />)}

    <SectionHeading emoji="⚖️" title="Legal & Advocacy" />
    {resourcesLegal.map((c, i) => <ResourceCard key={i} card={c} />)}

    <SectionHeading emoji="🛡️" title="Campus Safety" />
    {resourcesSafety.map((c, i) => <ResourceCard key={i} card={c} />)}

    <SectionHeading emoji="🎓" title="Academic Support" />
    {resourcesAcademic.map((c, i) => <ResourceCard key={i} card={c} />)}

    <SectionHeading emoji="🌈" title="Diversity & Inclusion" />
    {resourcesDiversity.map((c, i) => <ResourceCard key={i} card={c} />)}
  </div>
)

function extractResourceChips(resources: Record<string, Resource | Resource[] | string> | null | undefined) {
  if (!resources) return []
  const chips: { label: string; href?: string; phone?: string }[] = []
  const process = (r: Resource) => chips.push({ label: r.name || r.title || 'Resource', href: r.website || r.url || r.link, phone: r.phone })
  for (const value of Object.values(resources)) {
    if (typeof value === 'string') continue
    if (Array.isArray(value)) value.forEach(item => typeof item === 'object' && process(item as Resource))
    else if (typeof value === 'object' && value !== null) process(value as Resource)
  }
  return chips
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    text: "Hi! I'm ConnectAtlas, your UCalgary health companion. Ask me anything about campus health resources, mental wellness, or student support services. 💙",
  }])
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (view === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, view])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await sendMessage(text, conversationHistory)
      setConversationHistory(res.conversationHistory)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.reply || "I'm not sure how to help with that. Try asking about UCalgary health services!",
        resources: res.resources,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Sorry, I couldn't reach the server. ${err.message || 'Please try again shortly.'}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const navItems: { key: View; label: string }[] = [
    { key: 'chat',      label: '💬 Chat' },
    { key: 'health',    label: '🏥 Health & Wellness' },
    { key: 'resources', label: '📚 Resources' },
  ]

  return (
    <div className={`app-shell ${dark ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <LogoSVG />
          <span className="sidebar-title">ConnectAtlas</span>
        </div>
        <div className="sidebar-tagline">Your UCalgary<br />Health Companion</div>
        <nav className="sidebar-nav">
          {navItems.map(({ key, label }) => (
            <div key={key} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
              {label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDark(d => !d)} aria-label="Toggle theme">
            <div className="toggle-track">
              <span className="toggle-icon sun"><SunIcon /></span>
              <span className="toggle-icon moon"><MoonIcon /></span>
              <div className={`toggle-thumb ${dark ? 'right' : 'left'}`} />
            </div>
            <span className="toggle-label">{dark ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <div className="disclaimer">This tool provides general information only. For emergencies, call 911.</div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <LogoSVG />
            <div>
              <div className="header-title">ConnectAtlas</div>
              <div className="header-status"><span className="status-dot" />Health Assistant</div>
            </div>
          </div>
        </header>

        {view === 'chat' && (
          <>
            <div className="messages-area">
              {messages.map((msg, i) => {
                const chips = extractResourceChips(msg.resources)
                return (
                  <div key={i} className={`message-row ${msg.role}`}>
                    {msg.role === 'assistant' && <div className="avatar"><LogoSVG /></div>}
                    <div className="bubble-wrap">
                      <div className={`bubble ${msg.role}`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {chips.length > 0 && (
                        <div className="resources">
                          <div className="resources-label">📎 Helpful Resources</div>
                          {chips.map((chip, ri) => (
                            chip.href
                              ? <a key={ri} href={chip.href} target="_blank" rel="noopener noreferrer" className="resource-chip">
                                  {chip.label}{chip.phone ? ` · ${chip.phone}` : ''}
                                </a>
                              : <span key={ri} className="resource-chip no-link">
                                  {chip.label}{chip.phone ? ` · ${chip.phone}` : ''}
                                </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {loading && (
                <div className="message-row assistant">
                  <div className="avatar"><LogoSVG /></div>
                  <div className="bubble assistant"><TypingDots /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="input-area">
              <div className="input-box">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Ask about campus health resources, mental wellness, student services…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        )}

        {view === 'health' && (
          <div className="panel-scroll"><HealthPanel /></div>
        )}

        {view === 'resources' && (
          <div className="panel-scroll"><ResourcesPanel /></div>
        )}
      </main>
    </div>
  )
}