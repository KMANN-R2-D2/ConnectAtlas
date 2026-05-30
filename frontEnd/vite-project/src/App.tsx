import { useState, useRef, useEffect } from 'react'
import { sendMessage, fetchHealthWellness, fetchGeneralResources } from './api/chat'
import type { Resource, HealthWellnessData, GeneralResourcesData } from './api/chat'
import './App.css'

interface Message {
  role: 'user' | 'assistant'
  text: string
  resources?: Record<string, Resource | Resource[] | string> | null
  provider?: string | null
}

type NavView = 'chat' | 'health' | 'resources'
type Provider = 'cloudflare' | 'openai' | null

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Provider badge ────────────────────────────────────────────────────────────

const ProviderBadge = ({ provider }: { provider: Provider }) => {
  if (!provider) return null
  const isCloudflare = provider === 'cloudflare'
  return (
    <span className={`provider-badge ${isCloudflare ? 'provider-badge--cf' : 'provider-badge--oai'}`}>
      {isCloudflare ? '☁️ Gemma 4' : '🤖 GPT-4o Mini'}
    </span>
  )
}

// ── Resource chip extractor ───────────────────────────────────────────────────

function extractResourceChips(resources: Record<string, Resource | Resource[] | string> | null | undefined) {
  if (!resources) return []
  const chips: { label: string; href?: string; phone?: string }[] = []
  const processResource = (r: Resource) => {
    chips.push({ label: r.name || r.title || 'Resource', href: r.website || r.url || r.link, phone: r.phone })
  }
  for (const value of Object.values(resources)) {
    if (typeof value === 'string') continue
    if (Array.isArray(value)) value.forEach(item => typeof item === 'object' && processResource(item as Resource))
    else if (typeof value === 'object' && value !== null) processResource(value as Resource)
  }
  return chips
}

// ── Resource card ─────────────────────────────────────────────────────────────

interface ResourceCardProps {
  name: string
  description?: string
  phone?: string
  altPhone?: string
  email?: string
  website?: string
  hours?: string
  location?: string
  available?: string
  services?: string[]
  note?: string
  badge?: string
  badgeColor?: 'blue' | 'pink' | 'orange' | 'green'
}

function ResourceCard({ name, description, phone, altPhone, email, website, hours, location, available, services, note, badge, badgeColor = 'blue' }: ResourceCardProps) {
  return (
    <div className="resource-card">
      <div className="rc-header">
        <span className="rc-name">{name}</span>
        {badge && <span className={`rc-badge rc-badge--${badgeColor}`}>{badge}</span>}
      </div>
      {description && <p className="rc-desc">{description}</p>}
      <div className="rc-meta">
        {available && <span className="rc-pill rc-pill--green">🕐 {available}</span>}
        {hours && <span className="rc-pill">{hours}</span>}
        {location && <span className="rc-pill">📍 {location}</span>}
      </div>
      {services && services.length > 0 && (
        <ul className="rc-services">
          {services.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
      {note && <p className="rc-note">{note}</p>}
      <div className="rc-actions">
        {phone && <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="rc-action rc-action--phone">📞 {phone}</a>}
        {altPhone && <a href={`tel:${altPhone.replace(/[^0-9+]/g, '')}`} className="rc-action rc-action--phone">📞 {altPhone}</a>}
        {email && <a href={`mailto:${email}`} className="rc-action rc-action--email">✉️ {email}</a>}
        {website && <a href={website} target="_blank" rel="noopener noreferrer" className="rc-action rc-action--web">🔗 Visit website</a>}
      </div>
    </div>
  )
}

function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return <h3 className="panel-section-heading"><span>{emoji}</span>{title}</h3>
}

function SubHeading({ title }: { title: string }) {
  return <h4 className="panel-sub-heading">{title}</h4>
}

// ── Health & Wellness Panel ───────────────────────────────────────────────────

function HealthWellnessPanel() {
  const [data, setData] = useState<HealthWellnessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchHealthWellness().then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="panel-loading"><TypingDots /></div>
  if (error || !data) return <div className="panel-error"><p>Couldn't load resources. Please check your connection and try again.</p></div>

  const { ucalgary, studentUnion, ahs } = data

  return (
    <div className="info-panel">
      <div className="panel-hero">
        <span className="panel-hero-emoji">🏥</span>
        <div>
          <h2 className="panel-hero-title">Health &amp; Wellness</h2>
          <p className="panel-hero-sub">UCalgary health services, mental wellness support, and Student Union resources</p>
        </div>
      </div>

      <SectionHeading emoji="🎓" title="UCalgary Student Wellness Services" />
      <ResourceCard name={ucalgary.mentalHealth.name ?? ''} description={ucalgary.mentalHealth.description ?? 'Free, confidential mental health support for all registered UCalgary students.'} phone={ucalgary.mentalHealth.phone} email={ucalgary.mentalHealth.email} website={ucalgary.mentalHealth.website} hours={ucalgary.mentalHealth.hours} location={ucalgary.mentalHealth.location} services={ucalgary.mentalHealth.services} note={ucalgary.mentalHealth.bookingInfo} badge="Free" badgeColor="green" />
      <ResourceCard name={ucalgary.medicalClinic.name ?? ''} description={ucalgary.medicalClinic.description ?? 'On-campus medical clinic for walk-in appointments and student health needs.'} phone={ucalgary.medicalClinic.phone} website={ucalgary.medicalClinic.website} hours={ucalgary.medicalClinic.hours} location={ucalgary.medicalClinic.location} services={ucalgary.medicalClinic.services} badge="Free" badgeColor="green" />
      <ResourceCard name={ucalgary.sexualViolenceSupport.name ?? ''} description={ucalgary.sexualViolenceSupport.description} phone={ucalgary.sexualViolenceSupport.phone} email={ucalgary.sexualViolenceSupport.email} website={ucalgary.sexualViolenceSupport.website} badge="Confidential" badgeColor="pink" />
      <ResourceCard name={ucalgary.campusSecurity.name ?? ''} description={ucalgary.campusSecurity.description} phone={ucalgary.campusSecurity.phone} available={ucalgary.campusSecurity.available} note="Safe Walk program available — free escort service across campus at night" website={ucalgary.campusSecurity.safeWalk} badge="24/7" badgeColor="blue" />

      <SectionHeading emoji="🤝" title="Students' Union" />
      <ResourceCard name={studentUnion.insurance.name} description={`Coverage includes: ${Object.entries(studentUnion.insurance.coverage).map(([k, v]) => `${k}: ${v}`).join(' · ')}`} phone={studentUnion.insurance.phone} website={studentUnion.insurance.website} note={studentUnion.insurance.note} badge="All undergrads" badgeColor="orange" />
      <ResourceCard name={studentUnion.peerSupport.name ?? ''} description={studentUnion.peerSupport.description} website={studentUnion.peerSupport.website} services={studentUnion.peerSupport.services} badge="Free" badgeColor="green" />
      <ResourceCard name={studentUnion.qCentre.name ?? ''} description={studentUnion.qCentre.description} website={studentUnion.qCentre.website} location={studentUnion.qCentre.location} />

      <SectionHeading emoji="🏨" title="Alberta Health Services (AHS)" />
      <SubHeading title="Crisis &amp; Mental Health Lines" />
      <ResourceCard name={ahs.distressCentre.name ?? ''} description={ahs.distressCentre.description} phone={ahs.distressCentre.phone} website={ahs.distressCentre.website} available={ahs.distressCentre.available} note={ahs.distressCentre.text ? `Text: ${ahs.distressCentre.text}` : undefined} badge="24/7" badgeColor="pink" />
      <ResourceCard name={ahs.suicideCrisisHelpline.name ?? ''} description={ahs.suicideCrisisHelpline.description} phone={ahs.suicideCrisisHelpline.phone} available={ahs.suicideCrisisHelpline.available} note="Call or text 988" badge="24/7" badgeColor="pink" />
      <ResourceCard name={ahs.mentalHealthHelpLine.name ?? ''} description={ahs.mentalHealthHelpLine.description} phone={ahs.mentalHealthHelpLine.phone} available={ahs.mentalHealthHelpLine.available} badge="24/7" />
      <ResourceCard name={ahs.addictionHelpLine.name ?? ''} description={ahs.addictionHelpLine.description} phone={ahs.addictionHelpLine.phone} available={ahs.addictionHelpLine.available} badge="24/7" />
      <ResourceCard name={ahs.healthLink.name ?? ''} description={ahs.healthLink.description} phone={ahs.healthLink.phone} website={ahs.healthLink.website} available="24/7" services={ahs.healthLink.whenToCall} />

      <SubHeading title="Urgent Care &amp; ERs" />
      {ahs.urgentCare.map((c, i) => <ResourceCard key={i} name={c.name ?? ''} description={c.description} phone={c.phone} available={c.hours} note={`📍 ${c.address ?? ''}`} services={c.services} />)}
      {ahs.emergencyRooms.map((er, i) => <ResourceCard key={i} name={er.name ?? ''} phone={er.phone} note={`📍 ${er.address ?? ''}${er.note ? ` · ${er.note}` : ''}`} />)}

      <SubHeading title="Sexual Health" />
      <ResourceCard name={ahs.calgaryFamilyServices.name ?? ''} phone={ahs.calgaryFamilyServices.phone} website={ahs.calgaryFamilyServices.website} note={`📍 ${ahs.calgaryFamilyServices.address ?? ''}`} services={ahs.calgaryFamilyServices.services} />
    </div>
  )
}

// ── General Resources Panel ───────────────────────────────────────────────────

function GeneralResourcesPanel() {
  const [data, setData] = useState<GeneralResourcesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchGeneralResources().then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="panel-loading"><TypingDots /></div>
  if (error || !data) return <div className="panel-error"><p>Couldn't load resources. Please check your connection and try again.</p></div>

  const { ucalgary, studentUnion } = data

  return (
    <div className="info-panel">
      <div className="panel-hero">
        <span className="panel-hero-emoji">📚</span>
        <div>
          <h2 className="panel-hero-title">Resources</h2>
          <p className="panel-hero-sub">Financial help, legal support, campus safety, housing, and food security</p>
        </div>
      </div>

      <SectionHeading emoji="💰" title="Financial Help" />
      {ucalgary.financialAid.resources.map((r, i) => <ResourceCard key={i} name={r.name ?? ''} description={r.description} phone={r.phone} website={r.website} location={r.location} note={r.howToApply ? `How to apply: ${r.howToApply}` : r.turnaround} hours={r.hours} />)}
      <ResourceCard name={studentUnion.hardshipFund.name ?? ''} description={studentUnion.hardshipFund.description} email={studentUnion.hardshipFund.email} website={studentUnion.hardshipFund.website} note={studentUnion.hardshipFund.turnaround} services={studentUnion.hardshipFund.eligibility} badge="Last resort" badgeColor="orange" />

      <SectionHeading emoji="⚖️" title="Legal Help" />
      {ucalgary.legalHelp.resources.map((r, i) => <ResourceCard key={i} name={r.name ?? ''} description={r.description} phone={r.phone} website={r.website} location={r.location} hours={r.hours} badge={i === 0 ? 'Free for undergrads' : undefined} badgeColor="green" />)}

      <SectionHeading emoji="🛡️" title="Campus Safety" />
      {ucalgary.campusSafety.resources.map((r, i) => <ResourceCard key={i} name={r.name ?? ''} description={r.description} phone={r.phone} altPhone={r.altPhone} website={r.safeWalk ?? r.onlineReport ?? r.website} available={r.available} note={r.note} badge={r.available === '24/7' ? '24/7' : undefined} badgeColor="blue" />)}

      <SectionHeading emoji="🏠" title="Housing Help" />
      {ucalgary.housingHelp.resources.map((r, i) => <ResourceCard key={i} name={r.name ?? ''} description={r.description} website={r.website} note={r.note} />)}
      <ResourceCard name={studentUnion.offCampusHousing.name ?? ''} description={studentUnion.offCampusHousing.description} website={studentUnion.offCampusHousing.website} />

      <SectionHeading emoji="🥗" title="Food Security" />
      <ResourceCard name={studentUnion.foodBank.name ?? ''} description={studentUnion.foodBank.description} phone={studentUnion.foodBank.phone} email={studentUnion.foodBank.email} website={studentUnion.foodBank.website} hours={studentUnion.foodBank.hours} location={studentUnion.foodBank.location} note={studentUnion.foodBank.note} badge="Free · No ID" badgeColor="green" />
      {ucalgary.foodSecurity.resources.map((r, i) => <ResourceCard key={i} name={r.name ?? ''} description={r.description} website={r.website} location={r.location} />)}
      <ResourceCard name={studentUnion.denAffordableMeals.name ?? ''} description={studentUnion.denAffordableMeals.description} website={studentUnion.denAffordableMeals.website} location={studentUnion.denAffordableMeals.location} />

      <SectionHeading emoji="📣" title="Student Advocacy" />
      <ResourceCard name={studentUnion.advocacy.name ?? ''} description={studentUnion.advocacy.description} phone={studentUnion.advocacy.phone} email={studentUnion.advocacy.email} website={studentUnion.advocacy.website} location={studentUnion.advocacy.location} badge="Free" badgeColor="green" />

      <div className="panel-urgent-banner">
        <span>⚡</span>
        <div>
          <strong>Need urgent support?</strong>
          <p>{ucalgary.urgentSupport.description}</p>
          <a href={ucalgary.urgentSupport.website} target="_blank" rel="noopener noreferrer">UCalgary Urgent Support page →</a>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    text: "Hi! I'm ConnectAtlas, your UCalgary health companion. Ask me anything about campus health resources, mental wellness, or student support services. 💙",
  }])
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const [view, setView] = useState<NavView>('chat')
  const [provider, setProvider] = useState<Provider>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await sendMessage(text, conversationHistory)
      setConversationHistory(res.conversationHistory)
      if (res.provider) setProvider(res.provider as Provider)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.reply || "I'm not sure how to help with that. Try asking about UCalgary health services!",
        resources: res.resources,
        provider: res.provider,
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Sorry, I couldn't reach the server. ${err.message || 'Please try again shortly.'}`,
        provider: null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className={`app-shell ${dark ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <LogoSVG />
          <span className="sidebar-title">ConnectAtlas</span>
        </div>
        <div className="sidebar-tagline">Your UCalgary<br />Health Companion</div>
        <nav className="sidebar-nav">
          <button className={`nav-item${view === 'chat' ? ' active' : ''}`} onClick={() => setView('chat')}>💬 Chat</button>
          <button className={`nav-item${view === 'health' ? ' active' : ''}`} onClick={() => setView('health')}>🏥 Health &amp; Wellness</button>
          <button className={`nav-item${view === 'resources' ? ' active' : ''}`} onClick={() => setView('resources')}>📚 Resources</button>
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
          <div className="disclaimer">This tool provides general information only. For emergencies, call 911 or Campus Security at 403-220-5333.</div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <LogoSVG />
            <div>
              <div className="header-title">
                {view === 'chat' && 'ConnectAtlas'}
                {view === 'health' && 'Health & Wellness'}
                {view === 'resources' && 'Resources'}
              </div>
              <div className="header-status">
                {view === 'chat' && <><span className="status-dot" />Health Assistant</>}
                {view === 'health' && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>UCalgary · AHS · Student Union</span>}
                {view === 'resources' && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Financial · Legal · Safety · Housing · Food</span>}
              </div>
            </div>
          </div>
          {view === 'chat' && <ProviderBadge provider={provider} />}
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
                      <div className={`bubble ${msg.role}`}>{msg.text}</div>
                      {chips.length > 0 && (
                        <div className="resources">
                          <div className="resources-label">📎 Helpful Resources</div>
                          {chips.map((chip, ri) => (
                            chip.href
                              ? <a key={ri} href={chip.href} target="_blank" rel="noopener noreferrer" className="resource-chip">{chip.label}{chip.phone ? ` · ${chip.phone}` : ''}</a>
                              : <span key={ri} className="resource-chip no-link">{chip.label}{chip.phone ? ` · ${chip.phone}` : ''}</span>
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
                  className="chat-input"
                  placeholder="Ask about campus health resources, mental wellness, student services…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send message">
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

        {view === 'health' && <div className="panel-scroll"><HealthWellnessPanel /></div>}
        {view === 'resources' && <div className="panel-scroll"><GeneralResourcesPanel /></div>}
      </main>
    </div>
  )
}