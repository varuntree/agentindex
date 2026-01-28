# OpenAgent and Domain.com.au Data Schema Research

## OPENAGENT.COM.AU

### Agent Profile Pages
**URL Pattern:** `https://www.openagent.com.au/real-estate-agents/[agent-name]/[agent-id]`
**Example:** `https://www.openagent.com.au/real-estate-agents/david-bishop/6462`

#### Data Fields (Based on Research):
- **Personal Information:**
  - Agent name
  - Agent photo
  - Agency name and affiliation
  - Contact details (phone, email availability)
  
- **Performance Metrics:**
  - Total career sales count
  - Sales in last 12 months
  - Sales history (retained when agent changes agencies - unique to OpenAgent)
  - Recent sales with property details
  
- **Reviews & Ratings:**
  - Customer reviews from past clients
  - Ratings and review count
  - Review text snippets
  - Reviewer names and dates
  
- **Sales History:**
  - Property addresses
  - Sale prices
  - Sale dates
  - Property types
  - Some property images
  
- **Other:**
  - Years of experience
  - Suburbs covered/areas of operation
  - Specializations
  - Current listings
  
- **Agent Classifications:**
  - "Premier Agents" (maintain quality benchmarks, guaranteed in recommendations)
  - "Sponsored" agents (pay to appear in specific suburbs)

#### Gating:
- Research suggests some content may be gated behind email/contact form
- Unknown exactly what is public vs. gated

### Suburb/Area Agent Listing Pages
**URL Pattern:** `https://www.openagent.com.au/find-agents/[state]/[suburb]/[postcode]/[page]`
**Example:** `https://www.openagent.com.au/find-agents/nsw/bondi-beach/2026/1`

#### Data Shown:
- Total number of active agents in area (e.g., "92 active real estate agents")
- Total properties sold in last 12 months by all agents
- Agent listings with:
  - Career sales totals
  - Recent reviews
  - Performance metrics (specific fields unclear from research)

#### Filters & Sorting:
- **Unable to confirm specific filters from research**
- Likely location/suburb search
- Property type filters (implied)

### Agency Pages
**URL Pattern:** `https://www.openagent.com.au/real-estate-agency/a/[agency-name]/[agency-id]`
**Example:** `https://www.openagent.com.au/real-estate-agency/a/cbre/1777`

#### Data Fields:
- Agency name
- Office location(s)
- Agent roster
- Sales statistics (aggregate)
- Contact information

### Suburb Profile Pages
**URL Pattern:** `https://www.openagent.com.au/suburb-profiles/[suburb-name]-[postcode]`
**Example:** `https://www.openagent.com.au/suburb-profiles/newtown-2042`

#### Confirmed Data Fields (from Newtown example):

**Current Market Prices:**
- Median dwelling price (3-month avg)
- Median house price
- Median unit price

**Property Value Changes:**
- Overall growth % (3 months)
- House value growth % (12 months)
- Unit value growth % (12 months)
- 10-year and 30-year historical trends mentioned

**Sales Activity (12 months):**
- Number of houses sold
- Number of units sold
- Median days on market - houses
- Median days on market - units

**Rental Market Data:**
- Average house rent (weekly)
- Average unit rent (weekly)
- Rental growth % (annual)
- Rental yields
- Vacancy rates

**Demographics:**
- Population
- Median age
- % Rental properties
- Median household income (weekly)
- % Homeowners with mortgage
- % Owners outright
- Age distribution
- Income levels
- Ethnic makeup
- Family composition

**Additional Information:**
- Infrastructure developments
- Nearby amenities (schools, transport, shopping)
- Comparable suburbs with price differentials
- Key landmarks and features

### Open Estimates (Property Valuation Tool)
**URL:** `https://www.openagent.com.au/openestimates`

#### Inputs Required:
- Property address (autocomplete dropdown)
- Property condition assessment
- Unique property characteristics

#### Outputs:
- Estimated value range (not single figure)
- Property value history over time
- Suburb trends and statistics
- Timeline of rental and sales activity for the property
- Generated in under 1 minute

### Property Reports
**URL:** `https://www.openagent.com.au/property-reports`

#### Data Included:
- Estimated property value
- Property layout and size
- Sales history (historical transactions)
- Recent comparable sales nearby
- Suburb trends
- Days on market statistics
- Free report

### Commission Calculator
**URL:** `https://www.openagent.com.au/tools/commissions-calculator`

#### Inputs:
- Property address/suburb
- Expected sale price
- Commission rate (% or tiered)

#### Outputs:
- Commission amount calculation
- Net proceeds
- Side-by-side rate comparison
- Suburb average commission rates
- Cost breakdown (advertising, legal fees, etc.)
- Fixed vs. tiered commission comparison

### How Matching Works
- Uses 2,000,000+ sales transactions
- Proprietary internal data
- Agent performance metrics
- Sales history analysis
- Customer experience/reviews
- Data-driven recommendations (not pay-to-play for recommendations)
- Agents can sponsor to appear in specific suburbs

---

## DOMAIN.COM.AU

### Agent Profile Pages
**URL Pattern:** Unclear - could not access directly
**Likely:** `https://www.domain.com.au/real-estate-agents/[agent-name]-[id]/` (unconfirmed)

#### Data Fields (from scraper documentation):

**Personal Information:**
- Agent name
- Agent photo/profile picture
- Complete biography
- Contact details:
  - Phone numbers
  - Email availability
- Job title

**Performance Metrics:**
- Total properties for sale
- Average sold price
- Average days on market
- Total sold properties
- Total auctioned properties
- Total properties for rent

**Agency Information:**
- Agency name
- Agency logo
- Agency branding details
- Agency contact information
- Agency affiliations

**Additional:**
- Profile URL
- Areas of operation
- Specializations

### Suburb/Area Agent Listing Pages
**URL Pattern:** `https://www.domain.com.au/real-estate-agents/[suburb]-[state]-[postcode]/`
**Examples:**
- `https://www.domain.com.au/real-estate-agents/sydney-nsw-2000/`
- `https://www.domain.com.au/real-estate-agents/bondi-nsw-2026/`

#### Filters Available:
- Location (suburb, state, postcode)
- **Unable to confirm other filters from research**

#### Sorting Options:
- **Unable to confirm from research**

### Agency Pages
**URL Pattern:** `https://www.domain.com.au/real-estate-agencies/[agency-name]-[id]/`
**Example:** `https://www.domain.com.au/real-estate-agencies/kayburtonstonnington-88/`

#### Data Fields:
- Agency name
- Agency logo and branding
- Agent roster
- Contact information
- **Additional fields unclear**

### Property Listings Integration
- Shows agent contact details on property listings
- "Sold by" agent information on sold properties
- Current listings linked to agent profiles

### Reviews/Ratings System
- **Unclear if Domain has public reviews/ratings**
- No mention found in research

### Suburb Profile Pages
- **Unable to find Domain suburb profile pages in research**
- May not exist or may be limited

---

## KEY DIFFERENCES IDENTIFIED

### OpenAgent vs Domain:

1. **Business Model:**
   - OpenAgent: Agent comparison/matching platform with data focus
   - Domain: Property listing platform with agent profiles

2. **Sales History:**
   - OpenAgent: Retains agent's full career sales history across agencies (unique feature)
   - Domain: Likely shows current agency sales only

3. **Reviews:**
   - OpenAgent: Prominent review system (4.7/5 avg, 1500+ reviews on Trustpilot)
   - Domain: No clear review system found

4. **Agent Sponsorship:**
   - OpenAgent: "Premier" and "Sponsored" agent badges
   - Domain: Unknown

5. **Data Depth:**
   - OpenAgent: Heavy focus on performance metrics, comparisons, market data
   - Domain: Focus on current listings and contact info

6. **Suburb Profiles:**
   - OpenAgent: Comprehensive suburb data pages with demographics, trends, forecasts
   - Domain: Not found/unclear

---

## DATA GAPS & UNKNOWNS

### OpenAgent:
- Exact fields visible on agent profile before email gate
- Specific filter options on agent search
- Sort options on agent listings
- Exact format of sales history display
- Badge/certification types beyond "Premier" and "Sponsored"
- How "years experience" is calculated/displayed

### Domain:
- Individual agent profile page structure (couldn't access)
- Whether reviews/ratings exist
- Filter and sort options on agent listings
- Suburb-level statistics pages (if they exist)
- Performance data display format
- How sales data is verified
- Current listings integration details
- Commission comparison features (none found)

---

## SOURCES

### OpenAgent Sources:
- [Find and Compare Real Estate Agents - OpenAgent](https://www.openagent.com.au/)
- [Real Estate Agents in Bondi Beach, 2026, NSW | OpenAgent](https://www.openagent.com.au/find-agents/nsw/bondi-beach/2026/1)
- [Antoinette Burfurd - Local Real Estate Agent Profile, Stats & Sales | OpenAgent](https://www.openagent.com.au/real-estate-agents/antoinette-burfurd/148949)
- [David Bishop - Local Real Estate Agent Profile, Stats & Sales | OpenAgent](https://www.openagent.com.au/real-estate-agents/david-bishop/6462)
- [OpenAgent Agent Portal](https://agents.openagent.com.au/login)
- [What's OpenAgent All About? Info For Agents - OpenAgent](https://www.openagent.com.au/about-us/for-agents)
- [OpenAgent Reviews | Read Customer Service Reviews of openagent.com.au](https://au.trustpilot.com/review/openagent.com.au)
- [openagent.com.au Profile, Reviews & Listing Guide](https://www.mypresences.com/service/openagentcomau/)
- [Your Guide on How to View Real Estate Agent Profiles 2025 | TrueParity](https://www.trueparity.com/blog/your-guide-how-to-view-real-estate-agent-profiles-in-2025)
- [12 Best Online Resources for Agent Performance Data 2025 | TrueParity](https://www.trueparity.com/blog/top-resources-for-agent-performance-data-2025-guide)
- [Newtown Property Market and Trends | OpenAgent](https://www.openagent.com.au/suburb-profiles/newtown-2042)
- [Suburb profiles | The latest suburb price, trends & real estate data - OpenAgent](https://www.openagent.com.au/suburb-profiles)
- [Free property report with price estimate and history](https://www.openagent.com.au/property-reports)
- [Real Estate Agent Commission Calculator - OpenAgent](https://www.openagent.com.au/tools/commissions-calculator)
- [OpenEstimates | Calculate Your Property's Price - OpenAgent](https://www.openagent.com.au/openestimates/)

### Domain Sources:
- [Domain.com.au Real Estate Agents Scraper 🏠 · Apify](https://apify.com/easyapi/domain-com-au-real-estate-agents-scraper)
- [Input · Domain.com.au Agents Scraper · Apify](https://apify.com/shahidirfan/domain-com-au-real-estate-agents-scraper/input-schema)
- [Domain.com.au Agents Scraper · Apify](https://apify.com/shahidirfan/domain-com-au-real-estate-agents-scraper)
- [Efficient Domain Scraper for Australian Websites · Apify](https://apify.com/scrapemind/domaincomau-scraper)

