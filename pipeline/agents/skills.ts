/**
 * Simplified skill prompts for pipeline agents
 *
 * Each skill is a minimal, direct prompt that instructs the agent
 * what to find and what JSON format to return.
 */

// ---------------------------------------------------------------------------
// Input Interfaces
// ---------------------------------------------------------------------------

export interface AgencyDiscoveryInput {
  agencyName: string;
  suburb: string;
  state: string;
}

export interface TeamDiscoveryInput {
  websiteUrl: string;
}

export interface AgentEnrichmentInput {
  agent1FirstName: string;
  agent1LastName: string;
  agent2FirstName: string;
  agent2LastName: string;
  agencyName: string;
  agencyWebsite: string;
  suburb: string;
  state: string;
}

// ---------------------------------------------------------------------------
// AGENCY DISCOVERY PROMPT
// ---------------------------------------------------------------------------

export const AGENCY_DISCOVERY_PROMPT = `Find the official website for "{agencyName}" real estate agency in {suburb}, {state}, Australia.

Search for their official .com.au website (NOT Domain, realestate.com.au, or RateMyAgent).

Extract and return JSON:
{
  "name": "Full agency name as displayed on their website",
  "brandName": "Parent brand if applicable (e.g., Ray White, LJ Hooker)",
  "websiteUrl": "Official website URL",
  "phone": "Phone number",
  "email": "Email address",
  "streetAddress": "Street address",
  "suburb": "{suburb}",
  "state": "{state}",
  "postcode": "4-digit postcode",
  "logoUrl": "Logo image URL if found"
}

Return ONLY valid JSON, no other text.`;

// ---------------------------------------------------------------------------
// TEAM DISCOVERY PROMPT
// ---------------------------------------------------------------------------

export const TEAM_DISCOVERY_PROMPT = `Navigate to the team/agents page on {websiteUrl}.

Common paths: /team, /our-team, /agents, /our-people, /about-us/team

List ALL agents found. Return JSON:
{
  "team": [
    {
      "firstName": "First name",
      "lastName": "Last name",
      "photoUrl": "Photo URL (full absolute URL)",
      "phone": "Phone number",
      "email": "Email address",
      "profileUrl": "Individual profile page URL"
    }
  ]
}

Requirements:
- Include ALL team members who are sales agents
- Skip admin/marketing staff unless they do sales
- All URLs must be absolute (include https://domain.com)
- Return ONLY valid JSON, no other text.`;

// ---------------------------------------------------------------------------
// AGENT ENRICHMENT PROMPT (2 agents per sub-agent)
// ---------------------------------------------------------------------------

export const AGENT_ENRICHMENT_PROMPT = `Research these 2 real estate agents from {agencyName} ({suburb}, {state}):

Agent 1: {agent1FirstName} {agent1LastName}
Agent 2: {agent2FirstName} {agent2LastName}

For EACH agent, gather:
- Bio/about text
- Years of experience
- Languages spoken
- Specializations (residential, commercial, auctions, etc.)
- Suburbs they serve
- Recent sales (last 12-24 months): address, price, date, property type, beds/baths
- Reviews: rating (1-5), text, reviewer name, date, source platform

Data sources (priority order):
1. Agency website: {agencyWebsite}
2. RateMyAgent.com.au - search for agent name
3. Domain.com.au - agent profiles
4. General web search

Return JSON:
{
  "agents": [
    {
      "firstName": "string",
      "lastName": "string",
      "photoUrl": "string or null",
      "bio": "string or null",
      "yearsActive": "number or null",
      "languagesSpoken": ["string array"],
      "specializations": ["string array"],
      "suburbsServiced": ["string array - REQUIRED, at least one suburb"],
      "phone": "string or null",
      "email": "string or null",
      "sales": [
        {
          "propertyAddress": "Full street address",
          "suburb": "Suburb name",
          "state": "State code",
          "postcode": "4 digits",
          "propertyType": "house|apartment|unit|townhouse|land",
          "salePrice": "number (no $ or commas)",
          "saleDate": "YYYY-MM-DD",
          "bedrooms": "number or null",
          "bathrooms": "number or null",
          "carSpaces": "number or null"
        }
      ],
      "reviews": [
        {
          "overallRating": "number 1-5",
          "reviewText": "string",
          "reviewerName": "string or Anonymous",
          "reviewDate": "YYYY-MM-DD",
          "sourcePlatform": "ratemyagent|google|agency_website"
        }
      ]
    }
  ]
}

IMPORTANT:
- suburbsServiced is REQUIRED - at least include "{suburb}"
- All dates must be YYYY-MM-DD format
- All prices must be numbers (no $ or commas)
- Return ONLY valid JSON, no other text.`;

// ---------------------------------------------------------------------------
// Prompt Builders
// ---------------------------------------------------------------------------

export function buildAgencyDiscoveryPrompt(input: AgencyDiscoveryInput): string {
  return AGENCY_DISCOVERY_PROMPT
    .replace(/{agencyName}/g, input.agencyName)
    .replace(/{suburb}/g, input.suburb)
    .replace(/{state}/g, input.state);
}

export function buildTeamDiscoveryPrompt(input: TeamDiscoveryInput): string {
  return TEAM_DISCOVERY_PROMPT.replace(/{websiteUrl}/g, input.websiteUrl);
}

export function buildAgentEnrichmentPrompt(input: AgentEnrichmentInput): string {
  return AGENT_ENRICHMENT_PROMPT
    .replace(/{agent1FirstName}/g, input.agent1FirstName)
    .replace(/{agent1LastName}/g, input.agent1LastName)
    .replace(/{agent2FirstName}/g, input.agent2FirstName)
    .replace(/{agent2LastName}/g, input.agent2LastName)
    .replace(/{agencyName}/g, input.agencyName)
    .replace(/{agencyWebsite}/g, input.agencyWebsite)
    .replace(/{suburb}/g, input.suburb)
    .replace(/{state}/g, input.state);
}
