# AgentIndex — Product Requirements Document

## What We're Actually Building

This isn't a directory. This is a demand generation machine that:

- Captures high-intent consumer traffic via programmatic SEO
- Demonstrates Voqo's core product (voice agents) in every interaction
- Builds a data moat that compounds over time

## The Physics of This Business

**Traffic → Experience → Lead**

```
Consumer searches "[agent name]" or "real estate agents [suburb]"
    ↓
Lands on your page (SEO)
    ↓
Gets value (agent data, no friction)
    ↓
Interacts with voice agent (product demo disguised as utility)
```

## Why Competitors Are Beatable

| Competitor | Their Weakness | Your Advantage |
|---|---|---|
| RateMyAgent | Pay-to-play model, reviews gated behind subscriptions, requires sign-up | Free, unbiased, no login required |
| OpenAgent | Takes 20-30% commission, acts as middleman | You're a tool, not a broker |
| LocalAgentFinder | Requires registration to compare, charges agents per sale | Zero friction for consumers |

**Common weakness across all:** None of them let you experience what working with an agent feels like before contacting them. You change that with voice.

## High-Level Product Design

### Product Name Concept

- **Working title:** AgentIndex (or similar neutral name)
- **Positioning:** "Australia's open real estate agent directory"

### Core Pages (Programmatic SEO Architecture)

```
/                           → Homepage (search, featured suburbs)
/agents/                    → All agents directory
/agents/[state]/            → State-level agent list
/agents/[state]/[suburb]/   → Suburb-level agent list (money page)
/agent/[slug]/              → Individual agent profile (money page)
/agencies/                  → All agencies directory
/agencies/[slug]/           → Individual agency profile
/agency/[slug]/agents/      → Agents within an agency
```

**Why this structure:**

- Captures "[suburb] real estate agents" (high volume)
- Captures "[agent name]" (vanity + consumer intent)
- Captures "[agency name] agents" (comparison shopping)
- Flat architecture = fast crawling, good internal linking

## Page Templates

### 1. Agent Profile Page (`/agent/[slug]/`)

**Data displayed:**

- Name, photo (scraped or placeholder)
- Agency affiliation
- Suburbs serviced
- License number & status
- Years active (if available)
- Public sales history (if available, else "not yet indexed")
- Languages spoken (if available)
- Contact info (agency phone, not personal)

**Voqo Integration — The Magic:**

Two voice interaction points:

#### A. "Ask about this agent" (top of page)

- User clicks → ElevenLabs voice agent activates
- Agent is trained on the profile data
- User asks: "What suburbs does this agent cover?" "How many sales have they made?" "Are they good for first-time buyers?"
- The AI answers based on the profile + general real estate knowledge
- This demonstrates Voqo's technology to the consumer

#### B. "Talk to [Agent Name]'s Assistant" (prominent CTA)

- User clicks → Voice agent initialized as if it were the agent's assistant
- Pre-loaded with: agent's profile, agency info, general property Q&A
- User can ask: "Can you help me book an appraisal?" "What properties do they have listed?"
- This demonstrates what agents could have if they sign up for Voqo
- At end of call: "This is a demo of AI-powered assistance. [Agent Name] could respond to you personally — want us to notify them you're interested?"

### 2. Suburb Page (`/agents/[state]/[suburb]/`)

**Data displayed:**

- List of all agents active in that suburb
- Basic stats: number of agents, average sales, etc.
- Filter/sort by: agency, experience, sales count

**Voqo Integration:**

"Find the right agent for me" (voice search)

- User clicks → Voice agent asks qualifying questions
- "Are you buying or selling?" "What type of property?" "Any specific requirements?"
- AI recommends 2-3 agents from the list
- User can then view profiles or "talk to their assistant"

This is effectively lead qualification — demonstrating Voqo's BDR agent capabilities.

### 3. Agency Page (`/agency/[slug]/`)

**Data displayed:**

- Agency name, logo, location
- Total agents
- Suburbs covered
- Link to all agents within agency

**Voqo Integration:**

- "Talk to [Agency] reception" — voice agent acting as agency receptionist
- Demonstrates Voqo's Ava/Alex reception product

## Data Acquisition Strategy

### Phase 1: Seed the Database

**Source:** State licensing authorities (public record)

- NSW: NSW Fair Trading
- VIC: Consumer Affairs Victoria
- QLD: Office of Fair Trading
- etc.

This gives you:

- Agent names
- License numbers
- License status
- Agency affiliations

### Phase 2: Enrich via Scraping

Run nightly crawls:

- List all agencies (from license data)
- For each agency, scrape their website for agent profiles
- Extract: photo, bio, suburbs, sales (if listed), contact info

**Why not Domain/REA data initially:**

- Adds complexity and potential legal risk
- License data + agency scraping gets you 80% of the value
- Can add later once you've proven the model

## SEO Keyword Targets

**Tier 1:** Agent name searches (long-tail, high intent)

- "[First Last] real estate agent"
- "[First Last] [suburb]"
- "[First Last] reviews"

**Tier 2:** Suburb searches (higher volume)

- "real estate agents [suburb]"
- "best agents in [suburb]"
- "[suburb] property agents"

**Tier 3:** Agency searches

- "[Agency name] agents"
- "[Agency name] [suburb]"

**Tier 4:** Comparison/research searches

- "how to find a good real estate agent"
- "questions to ask a real estate agent"
- (These become blog content that links to directory pages)

## Moat Construction

**Short-term (0-6 months):**

- First-mover on voice-integrated agent directory
- SEO footprint across agent/suburb keywords

**Medium-term (6-18 months):**

- Proprietary data on agent responsiveness (tracked via voice interactions)
- User-generated content (reviews, corrections)

**Long-term (18+ months):**

- Becomes the default "about me" page agents link to
- Consumer trust as the unbiased source
- Network effects: more agents → more data → better SEO → more consumers → more agents

## What Makes This Different From RateMyAgent

| Dimension | RateMyAgent | AgentIndex |
|---|---|---|
| Revenue model | Agent subscriptions | Voqo conversions |
| Consumer friction | Sign-up to see details | Zero friction |
| Bias | Paid agents rank higher | Pure data, no rankings |
| Interaction | Read reviews | Voice-first experience |
| Value to agent | Reviews | Demo of AI assistant |

## Technical Stack (High-Level)

- **Frontend:** Next.js (for SSR/SSG, critical for SEO)
- **Database:** PostgreSQL (structured agent/agency data)
- **Voice:** ElevenLabs Conversational AI
- **Scraping:** Python (scheduled via cron)
- **Search:** Algolia or Meilisearch (for fast suburb/agent search)
- **Hosting:** Vercel or similar (edge performance matters for SEO)

## MVP Scope (First 4-6 Weeks)

**In MVP:**

- Data: Scrape NSW license database + top 50 agencies
- Pages: Agent profile template + suburb template
- Voice: One voice agent per page ("Ask about this agent")
- SEO: Submit sitemap, basic internal linking

**Not in MVP:**

- Full agency pages
- "Talk to agent's assistant" (phase 2)
- Reviews/ratings
- Domain/REA integration
- Agent claim flow & notifications
- Analytics & tracking

## Specification Files

| # | File | Scope |
|---|------|-------|
| 1 | `spec-tech-stack.md` | Frameworks, services, hosting, infra, CI/CD, environments, monitoring |
| 2 | `spec-architecture.md` | System architecture, service boundaries, data flow, deployment topology |
| 3 | `spec-data-model.md` | Database schema, entities, relationships, enums, indexes |
| 4 | `spec-data-pipeline.md` | All data acquisition — Claude-agent-powered scraping, ingestion, enrichment, dedup |
| 5 | `spec-api.md` | All API endpoints, request/response shapes, rate limiting |
| 6 | `spec-pages.md` | Every page template — routes, data requirements, components, behavior |
| 7 | `spec-design-system.md` | Typography, colors, spacing, component library, responsive breakpoints, brand |
| 8 | `spec-voice.md` | ElevenLabs integration, personas, system prompts, conversation flows, fallbacks |
| 9 | `spec-seo.md` | Sitemap strategy, structured data, internal linking, meta tags, rendering strategy |
