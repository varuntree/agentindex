# AgentIndex Page Specifications

**Version:** 1.0
**Stack:** Next.js 15 App Router (SSG), Tailwind CSS, Voqo.ai Design System
**Rendering:** Static Site Generation (SSG) for all pages
**Design System:** Mobile-first, Brutalist, Green (#26C169), Montserrat (headings), Inter (body), Black borders

## Table of Contents
- [Global Elements](#global-elements)
- [1. Homepage (`/`)](#1-homepage-)
- [2. Agent Profile Page (`/agent/[slug]/`)](#2-agent-profile-page-agentslug)
- [3. Suburb Agent Listing (`/agents/[state]/[suburb-slug]/`)](#3-suburb-agent-listing-agentsstatesuburb-slug)
- [4. Agency Profile (`/agency/[slug]/`)](#4-agency-profile-agencyslug)
- [5. All Agencies (`/agencies/`)](#5-all-agencies-agencies)
- [6. State Agent Listing (`/agents/[state]/`)](#6-state-agent-listing-agentsstate)
- [7. All Agents Directory (`/agents/`)](#7-all-agents-directory-agents)
- [Global Responsive Breakpoints](#global-responsive-breakpoints)
- [Component Reusability Matrix](#component-reusability-matrix)
- [Data Fetching Strategy](#data-fetching-strategy)
- [Performance Requirements](#performance-requirements)
- [Accessibility Requirements](#accessibility-requirements)
- [Error States](#error-states)
- [Voice Agent Integration Points](#voice-agent-integration-points)
- [URL Structure Summary](#url-structure-summary)
- [Content Generation Guidelines](#content-generation-guidelines)
- [Future Enhancements (Not in V1)](#future-enhancements-not-in-v1)

---

## Global Elements

### Navigation Bar
**Component:** `<GlobalNav />`
**Location:** Top of every page, sticky on scroll
**Responsive:** Collapses on mobile (<768px)

**Elements:**
- **Logo:** AgentIndex wordmark (left), links to `/`
- **Search Bar:**
  - Autocomplete: agents, suburbs, agencies
  - Min 2 chars to trigger
  - Results grouped by type
  - Mobile: transforms to icon, opens overlay
- **Links:**
  - Agents → `/agents/`
  - Agencies → `/agencies/`
- **Voice Navigator Button:**
  - Label: "Ask Navigator"
  - Persistent across all pages
  - Opens voice interface overlay

**Data Requirements:** None (static)

---

### Footer
**Component:** `<GlobalFooter />`
**Location:** Bottom of every page

**Sections:**
- **Directory Links:**
  - States (2-column grid): NSW, VIC, QLD, SA, WA, TAS, NT, ACT
  - Each state: top 5 suburbs by agent count
  - All links → respective pages
- **About:**
  - Tagline: "Transparent real estate agent data for Australia"
  - Description (50 words max)
- **Legal:**
  - Privacy Policy
  - Terms of Service
  - Contact

**Data Requirements:** Top 5 suburbs per state (cached, regenerated weekly)

---

### Voice Interface Overlay
**Component:** `<VoiceAgent mode="navigator" | "assistant" />`
**Trigger:** Floating button (bottom-right, z-index 1000)

**States:**
- **Collapsed:** Circular button, green (#26C169), microphone icon
- **Expanded:**
  - Fullscreen overlay (mobile)
  - Large modal (desktop)
  - Audio visualizer (animated bars)
  - Status text: "Listening..." / "Processing..." / "Speaking..."
  - Close button (X, top-right)
  - Mode indicator badge: "Navigator" or "[Agent Name] Assistant"

**Modes:**
- **Navigator:** Available globally, helps find agents/suburbs
- **Assistant:** Only on agent profile pages, context-aware of specific agent

**Data Requirements:**
- Navigator: suburb/agent index for search
- Assistant: agent profile data

---

### Search Overlay (Mobile)
**Component:** `<SearchOverlay />`
**Trigger:** Tap search icon in mobile nav

**Elements:**
- Fullscreen white background
- Large search input (top)
- Recent searches (if any, stored localStorage)
- Popular suburbs (top 8)
- Close button (X)

**Data Requirements:** Top 8 suburbs by agent count

---

### SEO Meta Tags (All Pages)
**Component:** `export const metadata` (Next.js)

**Required Fields:**
- `title`: Page-specific, max 60 chars
- `description`: Max 155 chars
- `openGraph`: title, description, image, url
- `twitter`: card type, title, description, image
- `canonical`: Absolute URL

---

### Structured Data (All Pages)
**Component:** `<script type="application/ld+json">`

**Types by Page:**
- Homepage: `WebSite`, `Organization`
- Agent Profile: `Person`, `RealEstateAgent`
- Suburb Listing: `ItemList`
- Agency Profile: `RealEstateAgent` (organization)

---

## Page Specifications

---

## 1. Homepage (`/`)

**Route:** `/`
**Template:** `app/page.tsx`
**Revalidation:** ISR, 1 hour

### Sections (Top to Bottom)

#### 1.1 Hero Section
**Component:** `<Hero />`

**Elements:**
- **Headline (H1):** "Find Any Real Estate Agent in Australia"
  - Font: Montserrat Bold, 48px desktop / 32px mobile
  - Color: Black
- **Subheading (H2):** "Transparent data. No sign-up. No fees."
  - Font: Inter Regular, 20px desktop / 16px mobile
  - Color: Gray-700
- **Search Bar:**
  - Width: 600px max, full-width mobile
  - Placeholder: "Search agents, suburbs, or agencies"
  - Autocomplete dropdown
  - Green border on focus
- **Voice Navigator Button:**
  - Text: "Ask me to find an agent"
  - Style: Green (#26C169) background, white text, microphone icon
  - Opens voice overlay

**Data Requirements:** None

---

#### 1.2 Featured Suburbs
**Component:** `<FeaturedSuburbs suburbs={topSuburbs} />`

**Layout:**
- Grid: 4 columns desktop, 2 tablet, 1 mobile
- Card design: White background, black border 2px, hover shadow
- 12 suburbs displayed

**Card Elements (per suburb):**
- **Suburb Name (H3):** Montserrat Semibold, 18px
- **State + Postcode:** Inter Regular, 14px, gray-600
- **Agent Count:** "X agents" badge, green background
- **Median Price:** Large number, $XXX,XXX format
- **Link:** Entire card clickable → `/agents/[state]/[suburb-slug]/`

**Data Requirements:**
```typescript
interface SuburbCard {
  slug: string;
  name: string;
  state: string;
  postcode: string;
  agentCount: number;
  medianPrice: number;
}
```
Query: Top 12 suburbs by agent count, with median price (12mo)

---

#### 1.3 How It Works
**Component:** `<HowItWorks />`

**Layout:** 3 columns desktop, stacked mobile

**Steps:**
1. **Search**
   - Icon: Magnifying glass
   - Title: "Search"
   - Text: "Find agents by suburb, name, or agency"
2. **Browse**
   - Icon: Bar chart
   - Title: "Browse Data"
   - Text: "Transparent sales, reviews, performance metrics"
3. **Talk**
   - Icon: Microphone
   - Title: "Ask AI"
   - Text: "Get instant answers from agent assistants"

**Data Requirements:** None (static content)

---

#### 1.4 Stats Banner
**Component:** `<StatsBar stats={siteStats} />`

**Layout:** Horizontal bar, black background, white text, centered

**Elements:**
- **Total Agents:** "X,XXX Agents Indexed"
- **Total Suburbs:** "X,XXX Suburbs Covered"
- **Total Agencies:** "X,XXX Agencies"
- Separator: Green vertical bars

**Data Requirements:**
```typescript
interface SiteStats {
  totalAgents: number;
  totalSuburbs: number;
  totalAgencies: number;
}
```
Query: Count records from each table

---

#### 1.5 Popular Agencies
**Component:** `<AgencyCarousel agencies={popularAgencies} />`

**Layout:**
- Horizontal scrolling carousel
- Auto-scroll: 3s per agency
- 8 agencies displayed

**Card Elements:**
- Agency logo (200x100px, contain fit)
- Agency name (below logo)
- Link → agency page

**Data Requirements:**
```typescript
interface AgencyLogo {
  slug: string;
  name: string;
  logoUrl: string;
}
```
Query: Top 8 agencies by agent count

---

### SEO Metadata (Homepage)
```typescript
export const metadata = {
  title: "AgentIndex | Find Real Estate Agents in Australia",
  description: "Search transparent data on real estate agents across Australia. Sales, reviews, performance metrics. No sign-up required.",
  openGraph: {
    title: "AgentIndex - Find Any Real Estate Agent in Australia",
    description: "Transparent agent data. No fees. No sign-up.",
    images: ["/og-home.png"],
  }
}
```

**Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AgentIndex",
  "url": "https://agentindex.com.au",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://agentindex.com.au/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 2. Agent Profile Page (`/agent/[slug]/`)

**Route:** `/agent/[slug]/`
**Template:** `app/agent/[slug]/page.tsx`
**Revalidation:** ISR, 24 hours
**Priority:** HIGH (money page)

### Sections (Top to Bottom)

#### 2.1 Header
**Component:** `<AgentHeader agent={agent} />`

**Layout:** Flexbox, photo left, info right (desktop); stacked (mobile)

**Elements:**
- **Photo:**
  - Size: 200x200px desktop, 150x150px mobile
  - Rounded corners (8px)
  - Black border 2px
  - Fallback: Initials on green background
- **Full Name (H1):**
  - Montserrat Bold, 36px desktop / 28px mobile
  - Black
- **Agency (linked):**
  - Agency logo (40px height)
  - Agency name (Inter Semibold, 18px)
  - Link → `/agency/[agency-slug]/`
- **License Info:**
  - Number: "License #XXXXXX"
  - Status badge:
    - Active: Green background, white text
    - Suspended: Red background
    - Unknown: Gray background
- **Experience:** "X years in real estate"
- **Languages:**
  - Badge chips (gray background, rounded)
  - E.g., "English", "Mandarin", "Arabic"
- **Contact Icons (row):**
  - Phone (clickable tel: link)
  - Email (clickable mailto: link)
  - Website (external link)
  - All icons: 24px, black, hover green
- **Social Links:**
  - LinkedIn, Facebook, Instagram icons
  - External links, open new tab
- **Voice Assistant Button:**
  - Large green button
  - Text: "Talk to [FirstName]'s Assistant"
  - Microphone icon
  - Opens voice overlay in "assistant" mode

**Data Requirements:**
```typescript
interface Agent {
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl: string | null;
  agency: {
    slug: string;
    name: string;
    logoUrl: string;
  };
  licenseNumber: string;
  licenseStatus: 'active' | 'suspended' | 'unknown';
  yearsExperience: number;
  languages: string[];
  phone: string;
  email: string;
  website: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}
```

---

#### 2.2 Performance Stats
**Component:** `<PerformanceStats stats={performanceStats} />`

**Layout:** Grid 3 columns desktop, 2 tablet, 1 mobile

**Stat Cards (each):**
- White background, black border, hover shadow
- Large number (Montserrat Bold, 32px)
- Label below (Inter Regular, 14px, gray-600)
- Icon (top-right, green)

**Stats:**
1. **Properties Sold (12mo):** Number
2. **Total Sales Value:** $XX.XM format
3. **Average Sale Price:** $XXX,XXX
4. **Median Days on Market:** XX days
5. **Sale Price Accuracy:** XX% (vs listing price)
6. **Top Property Type:** Icon + label (e.g., "Houses: 65%")

**Property Type Breakdown:**
- Donut chart (below stat grid)
- Categories: Houses, Apartments, Townhouses, Land, Other
- Colors: Green shades
- Percentages + counts

**Data Requirements:**
```typescript
interface PerformanceStats {
  propertiesSold12mo: number;
  totalSalesValue: number;
  avgSalePrice: number;
  medianDaysOnMarket: number;
  salePriceAccuracy: number; // percentage
  propertyTypeBreakdown: {
    houses: number;
    apartments: number;
    townhouses: number;
    land: number;
    other: number;
  };
}
```
Query: Aggregate sales data from last 12 months for this agent

---

#### 2.3 Suburbs Served
**Component:** `<SuburbsServed suburbs={suburbs} />`

**Layout:** Flexbox wrap, badge chips

**Elements:**
- Each suburb: Badge (gray background, black border, rounded)
- Text: "Suburb Name, STATE"
- Link → suburb page
- **Primary Suburb:** Green background (instead of gray)
- Max 10 suburbs shown, "Show All" button if more

**Data Requirements:**
```typescript
interface SuburbBadge {
  slug: string;
  name: string;
  state: string;
  isPrimary: boolean;
  salesCount: number; // for sorting
}
```
Query: Distinct suburbs from agent's sales, ordered by sales count

---

#### 2.4 Sales History
**Component:** `<SalesHistory sales={sales} pagination={pagination} />`

**Layout:** Table desktop, card list mobile

**Controls (above table):**
- **Sort Dropdown:** Date (newest first) | Date (oldest) | Price (high-low) | Price (low-high)
- **Filters:**
  - Property Type: All | Houses | Apartments | Townhouses | Land
  - Date Range: Last 6mo | Last 12mo | Last 24mo | All Time
- **Results Count:** "Showing X of Y sales"

**Table Columns (desktop):**
1. **Property** (image + address)
   - Thumbnail: 80x60px
   - Address: Street address only (clickable if listing page exists)
   - Type icon + beds/baths/parking (e.g., "🏠 3 🛏️ 2 🚿 2 🚗")
2. **Sale Price:** $XXX,XXX (Montserrat Semibold)
3. **Sale Date:** DD/MM/YYYY
4. **Sale Method:** Badge (Auction/Private/Tender)
5. **Days on Market:** XX days

**Card Layout (mobile):**
- Image top (full-width)
- Address (bold)
- Type + icons row
- Price (large, green)
- Sale date + method + DOM (small text)

**Pagination:**
- 20 sales per page
- Previous/Next buttons
- Page numbers (show 5 max)
- URL params: `?page=X&sort=price-desc&type=house`

**Data Requirements:**
```typescript
interface Sale {
  id: string;
  propertyImageUrl: string | null;
  address: string;
  propertyType: 'house' | 'apartment' | 'townhouse' | 'land' | 'other';
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  salePrice: number;
  saleDate: string; // ISO date
  saleMethod: 'auction' | 'private' | 'tender' | 'unknown';
  daysOnMarket: number | null;
  listingUrl: string | null;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
```
Query: Agent's sales with filters/sort, paginated

---

#### 2.5 Reviews Section
**Component:** `<ReviewsSection reviews={reviews} stats={reviewStats} />`

**Overall Rating (top):**
- **Large Star Display:** 4.5 ★★★★☆ (Montserrat Bold, 48px)
- **Total Reviews:** "(Based on X reviews)"
- **Would Hire Again:** "XX% would hire again" (green badge)

**Sub-Ratings (bar chart):**
- Communication: ████░ 4.6/5
- Local Knowledge: ███░░ 3.8/5
- Negotiation: █████ 5.0/5
- Responsiveness: ████░ 4.2/5
- Marketing: ███░░ 3.5/5
- Bars: Green fill, gray background, black border

**Sort Controls:**
- Most Recent | Highest Rated | Lowest Rated

**Individual Reviews:**
- **Card per review:**
  - Reviewer name (bold) or "Anonymous"
  - Buyer/Seller badge
  - Star rating (★★★★★)
  - Review text (max 300 chars, "Read More" if longer)
  - Property address + type (if linked to sale)
  - Date (relative: "2 months ago")
  - **Price Expectations Badge:**
    - "Exceeded expectations" (green)
    - "Met expectations" (gray)
    - "Below expectations" (red)
  - **Verified Badge:** "✓ Verified Buyer" (if verified)

**Pagination:** 10 reviews per page

**Data Requirements:**
```typescript
interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  wouldHireAgainPercent: number;
  subRatings: {
    communication: number;
    localKnowledge: number;
    negotiation: number;
    responsiveness: number;
    marketing: number;
  };
}

interface Review {
  id: string;
  reviewerName: string | null; // null = anonymous
  isBuyer: boolean; // false = seller
  rating: number; // 1-5
  reviewText: string;
  propertyAddress: string | null;
  propertyType: string | null;
  reviewDate: string; // ISO
  priceExpectations: 'exceeded' | 'met' | 'below' | null;
  isVerified: boolean;
}
```
Query: Reviews for agent, with stats aggregated

---

#### 2.6 Similar Agents
**Component:** `<SimilarAgents agents={similarAgents} />`

**Layout:** Horizontal carousel (scrollable)

**Heading:** "Similar Agents in [Primary Suburb]"

**Agent Cards (3-4 shown):**
- Photo (100x100px, circular)
- Full name (bold)
- Agency name
- Star rating + review count
- Sales count (12mo)
- "View Profile" button
- Link → agent page

**Data Requirements:**
```typescript
interface SimilarAgent {
  slug: string;
  fullName: string;
  photoUrl: string | null;
  agencyName: string;
  rating: number;
  reviewCount: number;
  salesCount12mo: number;
}
```
Query: Agents in same primary suburb, similar sales count range, exclude current agent, limit 4

---

### SEO Metadata (Agent Profile)
```typescript
export const metadata = {
  title: "[Agent Name] - [Agency] | [Primary Suburb] Real Estate Agent",
  description: "[Agent Name] is a real estate agent in [Suburb], [State] with [X] properties sold. View sales history, reviews, and contact details.",
  openGraph: {
    title: "[Agent Name] - Real Estate Agent in [Suburb]",
    description: "[X] sales | [Y] reviews | [Z] avg rating",
    images: [agent.photoUrl || "/og-default.png"],
  }
}
```

**Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "[Full Name]",
  "image": "[photoUrl]",
  "telephone": "[phone]",
  "email": "[email]",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[Primary Suburb]",
    "addressRegion": "[State]",
    "addressCountry": "AU"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[rating]",
    "reviewCount": "[reviewCount]"
  }
}
```

---

## 3. Suburb Agent Listing (`/agents/[state]/[suburb-slug]/`)

**Route:** `/agents/[state]/[suburb-slug]/`
**Template:** `app/agents/[state]/[suburb-slug]/page.tsx`
**Revalidation:** ISR, 6 hours
**Priority:** HIGH (SEO volume)

### Sections (Top to Bottom)

#### 3.1 Suburb Header
**Component:** `<SuburbHeader suburb={suburb} stats={suburbStats} />`

**Elements:**
- **Suburb Name (H1):** "[Suburb], [STATE] [Postcode]"
  - Montserrat Bold, 40px desktop / 28px mobile
- **Agent Count:** "X real estate agents" (gray text)
- **Market Stats Grid (4 columns desktop, 2 mobile):**
  1. **Median Sale Price:** $XXX,XXX
     - YoY Change: +X% ↗ (green) or -X% ↘ (red)
  2. **Avg Days on Market:** XX days
  3. **Total Sales (12mo):** X,XXX sales
  4. **Price Range:** $XXX,XXX - $X.XXM
- **Voice Navigator Button:**
  - Text: "Help me find an agent in [Suburb]"
  - Green background, full-width mobile

**Data Requirements:**
```typescript
interface SuburbHeader {
  name: string;
  state: string;
  postcode: string;
  agentCount: number;
}

interface SuburbStats {
  medianPrice: number;
  medianPriceYoYChange: number; // percentage
  avgDaysOnMarket: number;
  totalSales12mo: number;
  priceMin: number;
  priceMax: number;
}
```
Query: Suburb record + sales aggregates

---

#### 3.2 Filter Bar
**Component:** `<FilterBar filters={filters} />`

**Layout:** Sticky on scroll (mobile: top-0, z-50)

**Elements:**
- **Sort Dropdown:**
  - Most Sales (default)
  - Top Rated
  - Avg Price (High to Low)
  - Avg Price (Low to High)
  - Name (A-Z)
- **Property Type Filter (chips):**
  - All (default, green when selected)
  - Houses
  - Apartments
  - Townhouses
  - Land
  - Toggle behavior (can select multiple)
- **Results Count:** "X agents found"

**URL Params:** `?sort=rating&type=house,apartment`

**Data Requirements:** None (client-side filter state)

---

#### 3.3 Agent Cards List
**Component:** `<AgentCardList agents={agents} />`

**Layout:** Vertical list (cards), 1 column all breakpoints

**Agent Card Elements (per agent):**
- **Photo:** 120x120px, left side (desktop), top (mobile)
- **Full Name (H3):** Montserrat Semibold, 20px, linked to profile
- **Agency:**
  - Logo (30px height)
  - Name (linked to agency page)
- **Star Rating:** ★★★★☆ 4.5 (X reviews)
- **Stats Row:**
  - Properties Sold: "XX sold (12mo)"
  - Avg Sale Price: "$XXX,XXX avg"
- **Primary Suburbs:**
  - Badge chips (max 3 shown)
  - Link to suburb pages
- **Action Buttons (right side, desktop; bottom, mobile):**
  - "View Profile" (white background, black border)
  - "Talk to Assistant" (green background, white text)

**Pagination:**
- 20 agents per page
- Load More button (mobile-friendly)
- Page numbers (desktop)
- URL param: `?page=X`

**Data Requirements:**
```typescript
interface AgentCard {
  slug: string;
  fullName: string;
  photoUrl: string | null;
  agency: {
    slug: string;
    name: string;
    logoUrl: string;
  };
  rating: number;
  reviewCount: number;
  propertiesSold12mo: number;
  avgSalePrice: number;
  primarySuburbs: {
    slug: string;
    name: string;
    state: string;
  }[];
}
```
Query: Agents with sales in this suburb, sorted/filtered, paginated

---

#### 3.4 Suburb Stats Section
**Component:** `<SuburbMarketOverview suburb={suburb} />`

**Elements:**
- **Market Overview Text:**
  - Auto-generated paragraph (150 words)
  - Template: "[Suburb] is a [description] suburb in [region], [State]. The median sale price of $XXX,XXX represents a [X%] [increase/decrease] over the past year. Properties spend an average of [X] days on market. The area is popular for [property types], with [X] sales recorded in the last 12 months."
- **Median Price by Property Type (table):**
  - Rows: Houses, Apartments, Townhouses, Land
  - Columns: Median Price, Sales Count, Avg DOM
- **Recent Notable Sales:**
  - 3 highest sales in last 6mo
  - Card: Image, address, price, sale date, agent name (linked)

**Data Requirements:**
```typescript
interface SuburbOverview {
  description: string; // generated or from DB
  priceByType: {
    type: string;
    medianPrice: number;
    salesCount: number;
    avgDOM: number;
  }[];
  notableSales: {
    imageUrl: string;
    address: string;
    price: number;
    saleDate: string;
    agentName: string;
    agentSlug: string;
  }[];
}
```

---

#### 3.5 Nearby Suburbs
**Component:** `<NearbySuburbs suburbs={nearbySuburbs} />`

**Heading:** "Real Estate Agents in Nearby Suburbs"

**Layout:** Grid 3 columns desktop, 2 tablet, 1 mobile

**Suburb Cards (6 shown):**
- Suburb name + state
- Agent count
- Median price
- Distance from current suburb (if available)
- Link → suburb page

**Data Requirements:**
```typescript
interface NearbySuburb {
  slug: string;
  name: string;
  state: string;
  agentCount: number;
  medianPrice: number;
  distanceKm: number | null;
}
```
Query: Suburbs within 10km or same region, ordered by agent count

---

### SEO Metadata (Suburb Listing)
```typescript
export const metadata = {
  title: "Real Estate Agents in [Suburb], [State] | AgentIndex",
  description: "Find the best real estate agents in [Suburb], [State]. Compare [X] agents by sales, reviews, and performance. Median price: $XXX,XXX.",
  openGraph: {
    title: "[X] Real Estate Agents in [Suburb], [State]",
    description: "Compare agents by sales, reviews, performance. Median price: $XXX,XXX.",
  }
}
```

**Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Real Estate Agents in [Suburb], [State]",
  "numberOfItems": "[agentCount]",
  "itemListElement": [
    {
      "@type": "RealEstateAgent",
      "position": 1,
      "name": "[Agent Name]",
      "url": "[agent URL]"
    }
    // ... more agents
  ]
}
```

---

## 4. Agency Profile (`/agency/[slug]/`)

**Route:** `/agency/[slug]/`
**Template:** `app/agency/[slug]/page.tsx`
**Revalidation:** ISR, 24 hours

### Sections (Top to Bottom)

#### 4.1 Agency Header
**Component:** `<AgencyHeader agency={agency} />`

**Elements:**
- **Logo:** 300x150px, contain fit, centered mobile
- **Agency Name (H1):** Montserrat Bold, 40px
- **Contact Info (row):**
  - Address (with map pin icon)
  - Phone (clickable tel:)
  - Email (clickable mailto:)
  - Website (external link icon)
- **Summary Stats (grid, 4 columns):**
  1. Total Agents: XX
  2. Total Sales (12mo): X,XXX
  3. Total Sales Value: $XX.XM
  4. Avg Sale Price: $XXX,XXX
- **Voice Receptionist Button:**
  - Text: "Talk to [Agency] Reception"
  - Green background, full-width mobile
  - Opens voice assistant (agency context)

**Data Requirements:**
```typescript
interface Agency {
  slug: string;
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  totalAgents: number;
  totalSales12mo: number;
  totalSalesValue12mo: number;
  avgSalePrice12mo: number;
}
```

---

#### 4.2 Agent Roster
**Component:** `<AgentRoster agents={agents} />`

**Heading:** "Our Agents"

**Sort Controls:**
- Sales Count (default)
- Rating
- Name (A-Z)

**Layout:** Grid 3 columns desktop, 2 tablet, 1 mobile

**Agent Cards (per agent):**
- Photo (150x150px, circular)
- Full name (bold, linked)
- Star rating + review count
- Sales count (12mo): "XX sold"
- Avg sale price: "$XXX,XXX avg"
- "View Profile" button

**Data Requirements:**
```typescript
interface AgencyAgent {
  slug: string;
  fullName: string;
  photoUrl: string | null;
  rating: number;
  reviewCount: number;
  salesCount12mo: number;
  avgSalePrice: number;
}
```
Query: All agents for this agency, with stats

---

#### 4.3 Agency Stats
**Component:** `<AgencyStats stats={stats} />`

**Sections:**

**Performance Overview (grid 2 columns):**
- Total Sales (12mo): X,XXX
- Total Value: $XX.XM
- Avg Days on Market: XX days
- Avg Sale Price: $XXX,XXX

**Property Type Breakdown:**
- Horizontal bar chart
- Categories: Houses, Apartments, Townhouses, Land, Other
- Percentages + counts
- Green bars

**Top Suburbs Covered (table):**
- Columns: Suburb, Sales Count, Avg Price
- Top 10 suburbs by sales count
- Each suburb linked to suburb page

**Data Requirements:**
```typescript
interface AgencyStats {
  totalSales12mo: number;
  totalValue12mo: number;
  avgDOM: number;
  avgPrice: number;
  propertyTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topSuburbs: {
    slug: string;
    name: string;
    state: string;
    salesCount: number;
    avgPrice: number;
  }[];
}
```

---

#### 4.4 Recent Sales
**Component:** `<RecentSales sales={sales} />`

**Heading:** "Recent Sales"

**Layout:** Table desktop, card list mobile

**Table Columns:**
1. Property (image + address)
2. Agent Name (linked)
3. Sale Price
4. Sale Date
5. Property Type

**Pagination:** 20 sales per page

**Data Requirements:**
```typescript
interface AgencySale {
  propertyImageUrl: string | null;
  address: string;
  agentName: string;
  agentSlug: string;
  salePrice: number;
  saleDate: string;
  propertyType: string;
}
```
Query: Sales by all agents in agency, sorted by date desc

---

### SEO Metadata (Agency Profile)
```typescript
export const metadata = {
  title: "[Agency Name] | Real Estate Agency | AgentIndex",
  description: "[Agency Name] has [X] real estate agents with [Y] sales in the last 12 months. View agent roster, sales history, and contact details.",
  openGraph: {
    title: "[Agency Name] - Real Estate Agency",
    description: "[X] agents | [Y] sales | $[Z] total value",
    images: [agency.logoUrl],
  }
}
```

**Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "[agency URL]",
  "name": "[Agency Name]",
  "image": "[logoUrl]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[address]"
  },
  "telephone": "[phone]",
  "email": "[email]"
}
```

---

## 5. All Agencies (`/agencies/`)

**Route:** `/agencies/`
**Template:** `app/agencies/page.tsx`
**Revalidation:** ISR, 6 hours

### Sections

#### 5.1 Page Header
**Component:** `<PageHeader />`

**Elements:**
- **Heading (H1):** "Real Estate Agencies in Australia"
- **Subheading:** "Browse [X] agencies across [Y] suburbs"
- **Search Bar:**
  - Placeholder: "Search agencies by name or suburb"
  - Autocomplete
  - Desktop: inline, Mobile: full-width

---

#### 5.2 State Filter Tabs
**Component:** `<StateTabs />`

**Layout:** Horizontal tabs (scrollable on mobile)

**Tabs:**
- All States (default)
- NSW, VIC, QLD, SA, WA, TAS, NT, ACT
- Active tab: green underline
- URL param: `?state=NSW`

---

#### 5.3 Agency Grid
**Component:** `<AgencyGrid agencies={agencies} />`

**Layout:** Grid 4 columns desktop, 2 tablet, 1 mobile

**Agency Card Elements:**
- Logo (200x100px, contain fit, white background)
- Agency name (H3, bold)
- Primary suburb + state
- Agent count: "XX agents"
- Total sales (12mo): "X,XXX sales"
- "View Agency" button
- Link → agency page

**Sort Controls (above grid):**
- Agency Name (A-Z, default)
- Agent Count
- Sales Count
- State

**Pagination:** 24 agencies per page

**Data Requirements:**
```typescript
interface AgencyCard {
  slug: string;
  name: string;
  logoUrl: string;
  primarySuburb: string;
  state: string;
  agentCount: number;
  salesCount12mo: number;
}
```
Query: All agencies with basic stats, filterable by state, sorted, paginated

---

### SEO Metadata (All Agencies)
```typescript
export const metadata = {
  title: "Real Estate Agencies in Australia | AgentIndex",
  description: "Browse [X] real estate agencies across Australia. Compare agents, sales, and performance by agency.",
}
```

---

## 6. State Agent Listing (`/agents/[state]/`)

**Route:** `/agents/[state]/` (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
**Template:** `app/agents/[state]/page.tsx`
**Revalidation:** ISR, 12 hours
**Purpose:** SEO bridge page (too many agents to list individually)

### Sections

#### 6.1 State Header
**Component:** `<StateHeader state={state} stats={stats} />`

**Elements:**
- **Heading (H1):** "Real Estate Agents in [State Name]"
- **Stats Row:**
  - Total agents: "X,XXX agents"
  - Total suburbs: "X,XXX suburbs covered"
  - Total sales (12mo): "XX,XXX sales"
  - Avg sale price: "$XXX,XXX"
- **Description:**
  - Auto-generated paragraph (100 words)
  - Template: "Find real estate agents across [State]. AgentIndex has indexed [X] agents in [Y] suburbs. Browse by suburb below to compare agents by sales, reviews, and performance."

**Data Requirements:**
```typescript
interface StateStats {
  state: string;
  stateName: string;
  totalAgents: number;
  totalSuburbs: number;
  totalSales12mo: number;
  avgSalePrice: number;
}
```

---

#### 6.2 Search Bar
**Component:** `<StateSearch state={state} />`

**Elements:**
- Search input: "Search agents or suburbs in [State]"
- Autocomplete: suburbs only (within state)
- Submit → redirects to suburb page

---

#### 6.3 Top Suburbs Grid
**Component:** `<TopSuburbsGrid suburbs={suburbs} />`

**Heading:** "Browse Agents by Suburb"

**Sort Controls:**
- Agent Count (default)
- Suburb Name (A-Z)
- Median Price (High to Low)

**Layout:** Grid 4 columns desktop, 2 tablet, 1 mobile

**Suburb Cards (per suburb):**
- Suburb name (H3, bold)
- Postcode
- Agent count: "XX agents"
- Median price: "$XXX,XXX"
- Sales count (12mo): "X,XXX sales"
- "View Agents" button
- Link → `/agents/[state]/[suburb-slug]/`

**Pagination:** 48 suburbs per page (or show all if <100)

**Data Requirements:**
```typescript
interface StateSuburb {
  slug: string;
  name: string;
  postcode: string;
  agentCount: number;
  medianPrice: number;
  salesCount12mo: number;
}
```
Query: Suburbs in state, ordered by agent count

---

### SEO Metadata (State Listing)
```typescript
export const metadata = {
  title: "Real Estate Agents in [State Name] | AgentIndex",
  description: "Find [X] real estate agents across [Y] suburbs in [State]. Compare by sales, reviews, and performance.",
}
```

---

## 7. All Agents Directory (`/agents/`)

**Route:** `/agents/`
**Template:** `app/agents/page.tsx`
**Revalidation:** Static (rarely changes)
**Purpose:** SEO directory hub

### Sections

#### 7.1 Page Header
**Component:** `<DirectoryHeader />`

**Elements:**
- **Heading (H1):** "Real Estate Agents by State"
- **Subheading:** "Browse agents across Australia"
- **Total Stats:**
  - "X,XXX agents indexed"
  - "X,XXX suburbs covered"

---

#### 7.2 State Cards Grid
**Component:** `<StateCardsGrid states={states} />`

**Layout:** Grid 4 columns desktop, 2 tablet, 1 mobile

**State Cards (per state):**
- **State Name (H2):** NSW, VIC, QLD, SA, WA, TAS, NT, ACT
- **Icon/Badge:** State abbreviation badge (green)
- **Stats:**
  - Agent Count: "X,XXX agents"
  - Suburb Count: "X,XXX suburbs"
  - Total Sales (12mo): "XX,XXX sales"
- **Button:** "Browse [State] Agents"
- **Link:** → `/agents/[state]/`

**Data Requirements:**
```typescript
interface StateCard {
  state: string;
  stateName: string;
  agentCount: number;
  suburbCount: number;
  salesCount12mo: number;
}
```
Query: Aggregate counts by state

---

### SEO Metadata (All Agents)
```typescript
export const metadata = {
  title: "Real Estate Agents by State | AgentIndex",
  description: "Browse real estate agents across all Australian states. Transparent sales data, reviews, and performance metrics.",
}
```

---

## Global Responsive Breakpoints

```css
/* Tailwind CSS Breakpoints */
mobile: < 768px       /* sm and below */
tablet: 768px-1024px  /* md */
desktop: > 1024px     /* lg and above */

/* Specific breakpoints */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Responsive Behavior Rules

**Navigation:**
- Desktop: Full nav bar with search inline
- Mobile: Hamburger menu, search icon (opens overlay)

**Grids:**
- 4-column grids → 2 columns (tablet) → 1 column (mobile)
- 3-column grids → 2 columns (tablet) → 1 column (mobile)
- 2-column grids → 1 column (mobile)

**Tables:**
- Desktop: Standard table
- Mobile: Card list (stacked rows)

**Agent Cards:**
- Desktop: Horizontal layout (photo left, info right)
- Mobile: Vertical layout (photo top, info below)

**Voice Buttons:**
- Desktop: Fixed width (300px max)
- Mobile: Full width (sticky to bottom on detail pages)

**Images:**
- All images: Lazy loaded, WebP format with fallback
- Responsive sizes via Next.js Image component
- Aspect ratios maintained

---

## Component Reusability Matrix

**Shared Components:**
- `<AgentCard />` - Used in: suburb listings, similar agents, agency roster
- `<SuburbBadge />` - Used in: agent profiles, search results
- `<StarRating />` - Used in: agent cards, reviews, agency stats
- `<PropertyTypeIcon />` - Used in: sales tables, stats breakdowns
- `<PriceDisplay />` - Used in: all price contexts
- `<Pagination />` - Used in: all paginated lists
- `<VoiceButton />` - Used in: all pages (different contexts)
- `<SearchBar />` - Used in: nav, homepage, state pages

**Page-Specific Components:**
- `<PerformanceStats />` - Agent profile only
- `<SalesHistory />` - Agent profile, agency profile
- `<ReviewsSection />` - Agent profile only
- `<AgencyHeader />` - Agency profile only

---

## Data Fetching Strategy

**All pages use SSG (Static Site Generation) via Next.js 14:**

```typescript
// Example: Agent Profile
export async function generateStaticParams() {
  const agents = await db.query('SELECT slug FROM agents');
  return agents.map(a => ({ slug: a.slug }));
}

export default async function AgentPage({ params }) {
  const agent = await getAgent(params.slug);
  const sales = await getSales(agent.id, { limit: 20, page: 1 });
  const reviews = await getReviews(agent.id);
  // ... etc
  return <AgentProfileTemplate agent={agent} sales={sales} reviews={reviews} />;
}
```

**Revalidation (ISR):**
- Homepage: 1 hour
- Agent profiles: 24 hours
- Suburb listings: 6 hours
- Agency profiles: 24 hours
- State/directory pages: 12 hours

**Client-side Filtering:**
- Sort/filter controls → URL params → re-fetch on server
- No client-side state for data filtering (SEO-friendly)

---

## Performance Requirements

**Core Web Vitals Targets:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Optimization Strategies:**
- Image optimization: Next.js Image, WebP, lazy loading
- Code splitting: Route-based, component lazy loading for modals
- Caching: Aggressive ISR, CDN caching (CloudFront/Vercel Edge)
- Fonts: Self-hosted Montserrat + Inter, preloaded
- Critical CSS: Inlined for above-fold content
- Prefetching: Next.js Link prefetch for related pages

---

## Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- All images: alt text (descriptive)
- Color contrast: 4.5:1 minimum (body text), 3:1 (large text)
- Keyboard navigation: All interactive elements focusable, visible focus states
- ARIA labels: Search inputs, buttons, navigation
- Semantic HTML: Proper heading hierarchy (H1 → H6)
- Form labels: All inputs have associated labels
- Skip links: "Skip to main content" (hidden, keyboard-accessible)

**Voice Interface Accessibility:**
- Text alternative for all voice features
- Visual feedback during voice interaction (waveform, status text)
- Ability to cancel/close voice interface with Escape key

---

## Error States

**Page-Level Errors:**
- **404 Not Found:**
  - Heading: "Agent/Suburb/Agency Not Found"
  - Suggestion: Search bar + links to directory
  - SEO: 404 status code, no index
- **500 Server Error:**
  - Heading: "Something went wrong"
  - Action: "Try again" button
  - Fallback: Static cached version if available

**Component-Level Errors:**
- **No Results (search/filter):**
  - Message: "No agents found. Try adjusting filters."
  - Action: Reset filters button
- **Missing Data:**
  - Agent photo → Initials placeholder
  - No reviews → "No reviews yet" message
  - No sales → "No recent sales" message

**Loading States:**
- **Page Load:** Full page skeleton (gray blocks)
- **Pagination:** Loading spinner on cards
- **Voice Interface:** Pulsing microphone icon, "Listening..." text

---

## Voice Agent Integration Points

### Navigator (Global)
**Trigger:** "Ask Navigator" button (nav bar + homepage)
**Context:** None (general search agent)
**Capabilities:**
- Find agents by name, suburb, agency
- Answer questions: "Best agent in Bondi?" → returns top-rated agents
- Navigate: "Show me agents in Melbourne" → redirects to VIC state page
- Compare: "Compare agents in Manly" → opens suburb listing

**Example Prompts:**
- "Find me a top-rated agent in Sydney"
- "Who sold the most in Bondi last year?"
- "Show me agents near Parramatta"

---

### Assistant (Agent-Specific)
**Trigger:** "Talk to [Agent]'s Assistant" button (agent profile page)
**Context:** Full agent profile data (sales, reviews, suburbs)
**Capabilities:**
- Answer questions about agent: "How many sales last year?" → reads stats
- Property type focus: "Does [agent] sell apartments?" → analyzes sales history
- Suburb expertise: "Is [agent] experienced in Bondi?" → checks suburb list
- Reviews summary: "What do people say about [agent]?" → summarizes reviews
- Comparison: "How does [agent] compare to others in [suburb]?" → pulls similar agents

**Example Prompts:**
- "What's their average sale price?"
- "Do they have experience with luxury homes?"
- "What's their rating?"
- "How long have they been selling in this area?"

---

### Reception (Agency-Specific)
**Trigger:** "Talk to [Agency] Reception" button (agency profile page)
**Context:** Agency data + all agents in agency
**Capabilities:**
- Agent recommendations: "Who's your best agent for apartments?" → suggests based on stats
- Suburb coverage: "Do you have agents in Bondi?" → checks agent suburbs
- Availability: "Who's available in my area?" → filters by suburb
- Specializations: "Who handles commercial?" → filters by property type

**Example Prompts:**
- "Which agent sells the most in Manly?"
- "Do you have any Mandarin-speaking agents?"
- "Who's your top-rated agent?"

---

## URL Structure Summary

```
/                                  → Homepage
/agents/                           → All Agents Directory (state cards)
/agents/[state]/                   → State Agents (suburb cards)
/agents/[state]/[suburb-slug]/     → Suburb Agent Listing
/agent/[agent-slug]/               → Agent Profile
/agencies/                         → All Agencies
/agency/[agency-slug]/             → Agency Profile

Examples:
/agents/nsw/bondi/                 → Real estate agents in Bondi, NSW
/agent/john-smith-ray-white/       → John Smith's profile
/agency/ray-white-bondi/           → Ray White Bondi agency page
```

---

## Content Generation Guidelines

**Auto-Generated Text (for SEO):**
- Suburb descriptions: Template-based, uses stats (median price, sales count, property types)
- Agent meta descriptions: "[Name] is a real estate agent in [Suburb] with [X] properties sold..."
- State overviews: Generic template with dynamic stats

**Manual Content:**
- Agent bios: NOT auto-generated (requires manual data entry or scraping)
- Review text: User-submitted (cannot be fabricated)
- Agency descriptions: Optional manual field

**Avoid:**
- Fabricated reviews or testimonials
- Over-optimized keyword stuffing
- Duplicate content across pages

---

## Future Enhancements (Not in V1)

- Property search integration (link sales to property pages)
- Agent comparison tool (side-by-side stats)
- Advanced filters (years experience, languages, specializations)
- Interactive maps (suburb boundaries, agent coverage areas)
- Sales price estimator (based on agent performance)
- Saved agents / watchlists (requires user accounts)
- Direct messaging to agents (requires accounts + moderation)
- Video profiles for agents
- Live auction results feed

---

**End of Specification**

*Version 1.0 | Last Updated: 2026-01-28*
