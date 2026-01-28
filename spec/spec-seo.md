# SEO Specification — AgentIndex

**Last Updated:** 2026-01-28
**Priority:** CRITICAL — SEO is the primary acquisition channel

## Table of Contents
- [Overview](#overview)
- [Target Keywords](#target-keywords)
- [Page-Level SEO](#page-level-seo)
- [Sitemap Strategy](#sitemap-strategy)
- [robots.txt](#robotstxt)
- [Internal Linking Strategy](#internal-linking-strategy)
- [Technical SEO](#technical-seo)
- [Competitive SEO Advantages](#competitive-seo-advantages)
- [Content Freshness Strategy](#content-freshness-strategy)
- [Monitoring & Iteration](#monitoring--iteration)
- [Launch Checklist](#launch-checklist)
- [Future Optimizations (Phase 2)](#future-optimizations-phase-2)
- [Success Metrics](#success-metrics)

---

## Overview

AgentIndex is a **programmatic SEO machine**. Success depends entirely on dominating organic search for agent, suburb, and agency queries across Australia.

**Scale:** 50,000+ indexed pages generated from structured data
**Approach:** Static generation, zero friction, maximum indexability
**Edge:** Unique data (license verification, sale accuracy) + voice UX = unbeatable dwell time

---

## Target Keywords

### Tier 1: Agent Name (Long-tail, High Intent)
- `[First Last] real estate agent`
- `[First Last] [suburb]`
- `[First Last] reviews`
- `[First Last] sales history`
- `[First Last] real estate`

**Volume:** Low per query, but 50,000+ queries total
**Competition:** Low (most agents have no dedicated profile pages)
**Intent:** Extremely high — user knows exactly who they want

### Tier 2: Suburb (Higher Volume, Primary Traffic Driver)
- `real estate agents [suburb]`
- `best agents in [suburb]`
- `[suburb] property agents`
- `[suburb] real estate agents reviews`
- `top real estate agents [suburb] [year]`

**Volume:** Medium-high (500-5,000 searches/month for major suburbs)
**Competition:** High (RateMyAgent, realestate.com.au)
**Intent:** High — user actively searching for agent

### Tier 3: Agency
- `[Agency name] agents`
- `[Agency name] [suburb]`
- `[Agency name] reviews`

**Volume:** Medium
**Competition:** Low-medium
**Intent:** High

### Tier 4: Generic (Future — Blog Content)
- `how to find a good real estate agent`
- `questions to ask a real estate agent`
- `real estate agent fees Australia`
- `average real estate agent commission`

**Volume:** High
**Competition:** Very high
**Intent:** Medium (informational)
**Status:** Deferred to Phase 2

---

## Page-Level SEO

### Agent Profile (`/agent/[slug]/`)

#### Title Tag
```
[Full Name] — Real Estate Agent | [Agency Name] | AgentIndex
```

**Length:** 50-60 characters
**Primary keyword:** `[Full Name] real estate agent`
**Branding:** AgentIndex at end for brand recognition

#### Meta Description
```
[Full Name] is a real estate agent at [Agency Name] serving [suburb1], [suburb2]. [X] properties sold. [X] reviews. [avg rating]/5 rating. View sales history and performance.
```

**Length:** 150-160 characters
**Include:** Stats, suburbs, agency, rating (triggers FOMO + establishes credibility)

#### Heading Structure
```html
<h1>[Full Name]</h1>
<h2>Performance Stats</h2>
<h2>Sales History</h2>
<h2>Reviews</h2>
<h2>Suburbs Served</h2>
<h2>Similar Agents</h2>
```

**Rules:**
- ONE H1 per page (agent name)
- H2 for major sections only
- Never skip heading levels

#### Canonical URL
```html
<link rel="canonical" href="https://agentindex.com.au/agent/[slug]/" />
```

#### Schema.org (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "[Full Name]",
  "image": "[photo_url]",
  "url": "https://agentindex.com.au/agent/[slug]/",
  "telephone": "[phone]",
  "email": "[email]",
  "jobTitle": "Real Estate Agent",
  "worksFor": {
    "@type": "RealEstateAgent",
    "name": "[Agency Name]",
    "url": "https://agentindex.com.au/agency/[agency-slug]/"
  },
  "areaServed": [
    { "@type": "City", "name": "[suburb1]" },
    { "@type": "City", "name": "[suburb2]" }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[avg_rating]",
    "reviewCount": "[review_count]",
    "bestRating": 5,
    "worstRating": 1
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "[reviewer]" },
      "datePublished": "[date]",
      "reviewRating": { "@type": "Rating", "ratingValue": "[rating]" },
      "reviewBody": "[text]"
    }
  ]
}
```

**Impact:** Rich snippets with star ratings in SERPs (increases CTR 20-30%)

#### Open Graph
```html
<meta property="og:title" content="[Full Name] — Real Estate Agent">
<meta property="og:description" content="[meta description]">
<meta property="og:image" content="[photo_url or OG image]">
<meta property="og:url" content="https://agentindex.com.au/agent/[slug]/">
<meta property="og:type" content="profile">
```

**Fallback OG image:** Generated image with agent name, agency, stats if no photo

---

### Suburb Listing (`/agents/[state]/[suburb-slug]/`)

#### Title Tag
```
Best Real Estate Agents in [Suburb], [State] [Postcode] — 2026 | AgentIndex
```

**Notes:**
- Include year for freshness signal
- Include postcode for specificity (some suburbs share names)
- "Best" triggers comparison intent

#### Meta Description
```
Compare [X] real estate agents in [Suburb], [State]. Median sale price: $[X]. View ratings, sales history, and performance data. Find the best agent for you.
```

**Include:** Agent count, median sale price (unique data point), value proposition

#### Heading Structure
```html
<h1>Real Estate Agents in [Suburb], [State] [Postcode]</h1>
<h2>Top Agents</h2>
<h2>Market Stats</h2>
<h2>Recent Sales</h2>
<h2>Nearby Suburbs</h2>
```

#### Schema.org
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Real Estate Agents in [Suburb]",
  "description": "Top-rated real estate agents serving [Suburb], [State]",
  "numberOfItems": [agent_count],
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "RealEstateAgent",
        "name": "[Agent Name]",
        "url": "https://agentindex.com.au/agent/[slug]/",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "[rating]",
          "reviewCount": "[count]"
        }
      }
    }
  ]
}
```

#### Breadcrumb Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://agentindex.com.au"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Agents",
      "item": "https://agentindex.com.au/agents"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[State]",
      "item": "https://agentindex.com.au/agents/[state]"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "[Suburb]",
      "item": "https://agentindex.com.au/agents/[state]/[suburb-slug]"
    }
  ]
}
```

---

### Agency Profile (`/agency/[slug]/`)

#### Title Tag
```
[Agency Name] — Agents, Reviews & Sales | AgentIndex
```

#### Meta Description
```
[Agency Name] has [X] agents serving [suburb list]. [Total sales] properties sold. View team, reviews, and performance. Compare agents within [Agency Name].
```

#### Schema.org
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "[Agency Name]",
  "url": "https://agentindex.com.au/agency/[slug]/",
  "telephone": "[phone]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[street]",
    "addressLocality": "[suburb]",
    "addressRegion": "[state]",
    "postalCode": "[postcode]",
    "addressCountry": "AU"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[avg_rating]",
    "reviewCount": "[review_count]"
  },
  "employee": [
    {
      "@type": "RealEstateAgent",
      "name": "[Agent Name]",
      "url": "https://agentindex.com.au/agent/[slug]/"
    }
  ],
  "areaServed": [
    { "@type": "City", "name": "[suburb1]" },
    { "@type": "City", "name": "[suburb2]" }
  ]
}
```

---

### State Page (`/agents/[state]/`)

#### Title Tag
```
Real Estate Agents in [State Full Name] — 2026 | AgentIndex
```

**Examples:**
- `Real Estate Agents in New South Wales — 2026 | AgentIndex`
- `Real Estate Agents in Victoria — 2026 | AgentIndex`

#### Meta Description
```
Browse [X] real estate agents across [Y] suburbs in [State]. Find top-rated agents by suburb. Free, no sign-up required.
```

#### Content
- List of top suburbs (by property sales volume)
- Market stats (median sale price, total sales, etc.)
- Links to all suburb pages in state

---

### Homepage (`/`)

#### Title Tag
```
AgentIndex — Australia's Open Real Estate Agent Directory
```

**Length:** 58 characters
**Positioning:** "Open" = transparency, free access

#### Meta Description
```
Find and compare real estate agents across Australia. Transparent data, sales history, reviews, and performance stats. No sign-up. No fees. Free forever.
```

#### Schema.org
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AgentIndex",
  "url": "https://agentindex.com.au",
  "description": "Australia's open directory of real estate agents with transparent performance data, sales history, and reviews.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://agentindex.com.au/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Impact:** Enables sitelinks search box in Google SERPs

---

## Sitemap Strategy

### Structure
```
/sitemap.xml (sitemap index)
├── /sitemap-agents.xml (all agent profile pages)
├── /sitemap-suburbs.xml (all suburb listing pages)
├── /sitemap-agencies.xml (all agency pages)
└── /sitemap-pages.xml (static pages)
```

### Implementation
- Generated at build time via Next.js `app/sitemap.ts`
- Split by entity type to stay under 50,000 URLs per file
- Each sitemap uses `lastmod` from database `updated_at` field
- Priority values:
  - Suburb pages: `0.9` (primary traffic driver)
  - Agent profiles: `0.8` (high intent, long-tail)
  - Agency pages: `0.7`
  - Static pages: `0.5`
- Changefreq:
  - Suburb pages: `weekly` (sales data updates)
  - Agent profiles: `monthly` (review/sales updates)
  - Agency pages: `monthly`
  - Static pages: `yearly`

### Submission
- Submit to Google Search Console immediately after launch
- Submit to Bing Webmaster Tools
- Reference in `robots.txt`
- Monitor indexing status daily for first 2 weeks

---

## robots.txt

```
User-agent: *
Allow: /

# Block admin/API routes (double protection with X-Robots-Tag)
Disallow: /api/

# Sitemap
Sitemap: https://agentindex.com.au/sitemap.xml
```

**Location:** `/public/robots.txt`

---

## Internal Linking Strategy

**CRITICAL:** This is the backbone of programmatic SEO. Every page must link to related pages to distribute PageRank and enable discovery.

### Agent Profile Links To:
1. **Agency page** — via agency name in header/metadata
2. **Suburb pages** — each suburb badge links to suburb listing
3. **Similar agents** — same suburb + similar performance (3-5 agents)
4. **Sales property addresses** — link suburb name in address to suburb page
5. **State page** — via breadcrumb

**Internal link count:** 10-20 per agent page

### Suburb Page Links To:
1. **Agent profiles** — via agent cards (top 20 agents, paginated)
2. **Agency pages** — "Agencies in [Suburb]" section
3. **Nearby suburbs** — geographically adjacent (5-8 suburbs)
4. **State page** — via breadcrumb
5. **Recent sales** — agent name links to profile

**Internal link count:** 50-100 per suburb page (primary hub)

### Agency Page Links To:
1. **Agent profiles** — all agents in agency
2. **Suburb pages** — "Areas Served" section
3. **State page** — via breadcrumb

**Internal link count:** 20-50 per agency page

### Breadcrumbs (All Pages)

**Visible UI:**
```
Home > Agents > NSW > Bondi > John Smith
Home > Agencies > Ray White
```

**Schema.org:** Include `BreadcrumbList` JSON-LD on every page (see suburb example above)

### Footer Links

**States Section:**
```
Real Estate Agents by State
├── New South Wales
├── Victoria
├── Queensland
├── South Australia
├── Western Australia
├── Tasmania
├── Australian Capital Territory
└── Northern Territory
```

**Top Suburbs Section:**
```
Popular Suburbs
├── Bondi, NSW
├── Toorak, VIC
├── Paddington, QLD
├── ... (top 20 by traffic)
```

**Impact:** Creates strong internal link graph from every page to high-priority hubs

---

## Technical SEO

### Rendering Strategy

**SSG (Static Site Generation) — Non-Negotiable**

- All pages pre-rendered at build time via Next.js `generateStaticParams`
- Zero client-side rendering for content (Googlebot sees complete HTML)
- Voice agent UI hydrates client-side but doesn't affect content visibility
- Incremental Static Regeneration (ISR) for data updates without full rebuild

**Why SSG:**
- Google can index immediately (no JS execution required)
- Fastest possible TTFB (Vercel Edge CDN serves static HTML)
- No flicker/layout shift from client-side data fetching
- Maximum crawl budget efficiency

### Performance Targets

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **INP (Interaction to Next Paint):** < 200ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Additional:**
- **TTFB:** < 600ms (Vercel Edge CDN)
- **FCP:** < 1.8s
- **Speed Index:** < 3.4s

**Optimizations:**
- Next.js Image component (WebP, lazy loading, responsive srcset)
- Font display: swap (prevent FOIT)
- Minimal JavaScript for initial page load (< 100kb)
- Tailwind CSS purging (ship only used styles)
- Preconnect to critical origins (ElevenLabs, fonts)

### URL Structure

**Format:**
```
/agent/[slug]/                     # john-smith-bondi
/agents/[state]/[suburb-slug]/     # /agents/nsw/bondi/
/agency/[slug]/                    # ray-white-bondi
/agents/[state]/                   # /agents/nsw/
```

**Rules:**
- Lowercase only
- Hyphens for word separation (not underscores)
- No file extensions (.html, .php)
- No query parameters for primary content pages
- No trailing slashes (configure via Next.js `trailingSlash: false`)
- Keep URLs < 100 characters when possible

**Slug Generation:**
- Agent: `{firstname}-{lastname}-{primary-suburb}` (e.g., `john-smith-bondi`)
- Suburb: `{suburb-name}` (lowercase, hyphenated)
- Agency: `{agency-name}-{suburb}` (if multiple locations)

### Canonicalization

**Every page includes self-referencing canonical:**
```html
<link rel="canonical" href="https://agentindex.com.au/[path]/" />
```

**Handle duplicates:**
- Pagination: `?page=2` — canonical points to page 1
- Sorting: `?sort=rating` — canonical points to default sort
- WWW vs non-WWW — redirect non-WWW to WWW (or vice versa, pick one)

**Next.js config:**
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*/',
        has: [{ type: 'host', value: 'www.agentindex.com.au' }],
        destination: 'https://agentindex.com.au/:path*',
        permanent: true,
      },
    ]
  },
}
```

### Meta Robots

**Default (all directory pages):**
```html
<meta name="robots" content="index, follow">
```

**API routes:**
```typescript
// app/api/*/route.ts
export async function GET(request: Request) {
  return new Response(data, {
    headers: {
      'X-Robots-Tag': 'noindex',
    },
  })
}
```

**Search results page:**
```html
<meta name="robots" content="noindex, follow">
```
(Prevent indexing of infinite search result variations)

### Heading Hierarchy

**Rules:**
- ONE H1 per page (primary entity name)
- H2 for major sections
- H3 for subsections within H2
- Never skip heading levels (H1 → H3)
- Use semantic HTML (`<h1>`, not `<div class="text-4xl">`)

**Example (Agent Page):**
```html
<h1>John Smith</h1>
  <h2>Performance Stats</h2>
  <h2>Sales History</h2>
    <h3>Recent Sales</h3>
    <h3>Sale Price Trends</h3>
  <h2>Reviews</h2>
```

### Image SEO

**Alt Text:**
```html
<img alt="John Smith — Real Estate Agent at Ray White Bondi" src="..." />
```

**Format:** Always use descriptive alt text (agent name + agency)

**Optimization:**
- Use Next.js Image component (auto-generates WebP, responsive srcset)
- Lazy load images below the fold
- Serve from Vercel CDN (or Cloudinary if using third-party images)
- Include width/height to prevent CLS

**OG Images:**
- Generate dynamic OG images for each agent (name, photo, stats)
- Use `@vercel/og` for server-side OG image generation
- Fallback to generic AgentIndex OG image if no agent photo

### Page Speed Optimizations

1. **Next.js automatic code splitting** — only load JS for current page
2. **Tailwind CSS purging** — remove unused styles (CSS < 20kb)
3. **Font subsetting** — only include glyphs for English + numbers
4. **Preconnect to critical origins:**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://api.elevenlabs.io">
   ```
5. **Minimal third-party scripts** — defer analytics, no marketing pixels
6. **Service Worker (future)** — cache static assets for repeat visits

---

## Competitive SEO Advantages

### 1. Zero Friction
- No sign-up, no paywall, no email gate
- Google rewards sites that give value without friction
- Competitors (RateMyAgent) require registration to view contact info

### 2. Unique Data Points
- **License verification status** — no competitor shows this
- **Days on market** — calculated from listing data
- **Sale accuracy** — sold vs listed price delta
- **Median DOM by agent** — unique insight into agent performance

### 3. Voice Interaction
- Increases **dwell time** (positive ranking signal)
- Reduces **bounce rate**
- Users spend 2-5 minutes listening to agent summary vs 30 seconds reading

### 4. Fast Load Times
- SSG + Vercel Edge CDN = fastest possible delivery
- Competitors use client-side rendering (slow TTFB, poor LCP)
- Speed is a **direct ranking factor**

### 5. Structured Data (Rich Snippets)
- Star ratings in SERPs = higher CTR
- Review count, price stats in search results
- Competitors don't implement structured data properly

### 6. Comprehensive Internal Linking
- Every page links to 10-100 related pages
- Creates strong PageRank distribution
- Competitors have weak internal linking (silos)

### 7. Fresh Content
- Data updates from Domain, realestate.com.au nightly
- `lastmod` in sitemap triggers re-crawl
- Google favors fresh content for time-sensitive queries

---

## Content Freshness Strategy

### Automated Updates
- Scrape property sales data nightly
- Update agent sales history, median prices
- Recalculate performance stats (days on market, sale accuracy)
- Regenerate affected static pages via ISR

### Freshness Signals
- Update `lastmod` in sitemap on data change
- Include year in title tags (`2026`)
- Show "Last updated: [date]" on suburb pages
- Display "Recent sales (last 30 days)" prominently

---

## Monitoring & Iteration

### Google Search Console (Week 1+)
- Submit sitemap immediately after launch
- Monitor indexing status (Coverage report)
- Track impressions/clicks for target keywords
- Identify crawl errors, fix immediately

### Ranking Tracking (Week 2+)
- Track positions for top 100 target keywords:
  - 20 agent name queries
  - 50 suburb queries
  - 20 agency queries
  - 10 generic queries
- Use SerpWatcher or similar tool
- Weekly position reports

### Core Web Vitals (Ongoing)
- Monitor in Google Search Console
- Real user data via Vercel Analytics
- Fix any pages with poor LCP/CLS

### Organic Traffic Goals
- **Month 1:** 1,000 organic sessions
- **Month 3:** 10,000 organic sessions
- **Month 6:** 50,000 organic sessions
- **Month 12:** 200,000+ organic sessions

---

## Launch Checklist

### Pre-Launch
- [ ] All meta tags implemented (title, description, OG)
- [ ] Schema.org JSON-LD on all page types
- [ ] Canonical tags on all pages
- [ ] Sitemap generated and accessible
- [ ] robots.txt deployed
- [ ] Internal linking verified (spot check 20 pages)
- [ ] Core Web Vitals tested (all pages LCP < 2.5s)
- [ ] Mobile rendering verified
- [ ] Breadcrumbs (UI + schema) on all pages

### Launch Day
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify domain in GSC
- [ ] Set preferred domain (www vs non-www)
- [ ] Enable rich results monitoring in GSC

### Week 1
- [ ] Monitor indexing status (aim for 80%+ indexed)
- [ ] Check for crawl errors, fix immediately
- [ ] Verify structured data via Rich Results Test
- [ ] Monitor Core Web Vitals in GSC

### Month 1
- [ ] Analyze top queries in GSC
- [ ] Identify high-impression, low-CTR pages (optimize)
- [ ] Track ranking for top 20 target keywords
- [ ] A/B test title tags for top 10 pages

---

## Future Optimizations (Phase 2)

### Blog Content (Generic Keywords)
- "How to choose a real estate agent in [suburb]"
- "Questions to ask before hiring an agent"
- "Real estate agent commission rates in Australia"

### Video Embeds
- Agent introduction videos (if agents provide)
- Suburb overview videos (market trends, etc.)
- Increases dwell time, video carousel in SERPs

### User-Generated Content
- Agent reviews (moderated)
- Q&A section on agent pages
- Fresh content signal, keyword diversity

### LocalBusiness Schema
- Add `LocalBusiness` schema for agencies with physical locations
- Enable Google Maps integration
- Show in "near me" searches

---

## Success Metrics

**Primary:**
- Organic sessions (target: 200k/month by Month 12)
- Keyword rankings (target: Top 3 for 50+ suburb queries)
- Indexed pages (target: 95%+ of sitemap)

**Secondary:**
- Click-through rate from SERPs (target: 8%+)
- Dwell time (target: 3+ minutes avg)
- Core Web Vitals (target: 100% of pages "Good")

---

**End of Specification**
