/**
 * Voice integration types
 */

export type VoiceMode = 'navigator' | 'assistant';

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type PageType = 'home' | 'agent' | 'agency' | 'suburb';

export interface VoiceSessionRequest {
  pageType: PageType;
  slug?: string;
  voiceMode: VoiceMode;
  contextData?: {
    agent?: AgentVoiceContext;
    agency?: AgencyVoiceContext;
    suburb?: SuburbVoiceContext;
  };
}

export interface VoiceSessionResponse {
  signedUrl: string | null;
  error?: string;
}

// Context types for voice prompts
export interface AgentVoiceContext {
  fullName: string;
  agencyName: string;
  yearsExperience?: number;
  languages?: string[];
  specializations?: string[];
  suburbs?: string[];
  salesCount12mo?: number;
  avgSalePrice12mo?: number;
  medianDom12mo?: number;
  rating?: number;
  reviewCount?: number;
  recentSales?: SaleContext[];
  bio?: string;
}

export interface AgencyVoiceContext {
  name: string;
  locations?: string[];
  establishedYear?: number;
  agentCount?: number;
  specializations?: string[];
  salesCount12mo?: number;
  avgSalePrice12mo?: number;
  totalVolume12mo?: number;
  topAgents?: TopAgentContext[];
  description?: string;
}

export interface SuburbVoiceContext {
  name: string;
  state: string;
  postcode: string;
  salesCount12mo?: number;
  medianHousePrice12mo?: number;
  medianApartmentPrice12mo?: number;
  medianDom12mo?: number;
  topAgents?: SuburbAgentContext[];
  demographics?: string;
}

export interface SaleContext {
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  soldDate: string;
}

export interface TopAgentContext {
  fullName: string;
  salesCount12mo: number;
  avgSalePrice12mo: number;
}

export interface SuburbAgentContext {
  fullName: string;
  agencyName: string;
  salesCountSuburb: number;
  specializations: string[];
  rating: number;
}

// Dynamic variables for ElevenLabs
export interface NavigatorVariables {
  current_page: PageType;
  current_slug: string;
  total_agents: number;
  total_suburbs: number;
  total_agencies: number;
}

export interface AgentAssistantVariables {
  agent_name: string;
  agency_name: string;
  agent_context: string;
}

export interface AgencyAssistantVariables {
  agency_name: string;
  agency_context: string;
}

export interface SuburbAssistantVariables {
  suburb_name: string;
  state: string;
  suburb_context: string;
}

export type DynamicVariables =
  | NavigatorVariables
  | AgentAssistantVariables
  | AgencyAssistantVariables
  | SuburbAssistantVariables;
