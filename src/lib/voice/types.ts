/**
 * Voice integration types
 */

export type VoiceMode = 'navigator' | 'assistant';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export type PageType = 'home' | 'agent' | 'agency' | 'suburb';

export interface VoiceSessionRequest {
  page_type: PageType;
  voice_mode: VoiceMode;
  agent_slug?: string;
  agency_slug?: string;
  suburb_slug?: string;
  context_data?: {
    agent?: AgentVoiceContext;
    agency?: AgencyVoiceContext;
    suburb?: SuburbVoiceContext;
  };
}

export interface VoiceSessionResponse {
  signedUrl: string | null;
  error?: string;
}

// Context types for voice prompts (snake_case per spec)
export interface AgentVoiceContext {
  full_name: string;
  agency_name: string;
  years_experience?: number;
  languages?: string[];
  specializations?: string[];
  suburbs?: string[];
  sales_count_12mo?: number;
  avg_sale_price_12mo?: number;
  median_dom_12mo?: number;
  rating?: number;
  review_count?: number;
  recent_sales?: SaleContext[];
  bio?: string;
}

export interface AgencyVoiceContext {
  name: string;
  locations?: string[];
  established_year?: number;
  agent_count?: number;
  specializations?: string[];
  sales_count_12mo?: number;
  avg_sale_price_12mo?: number;
  total_volume_12mo?: number;
  top_agents?: TopAgentContext[];
  description?: string;
}

export interface SuburbVoiceContext {
  name: string;
  state: string;
  postcode: string;
  sales_count_12mo?: number;
  median_house_price_12mo?: number;
  median_apartment_price_12mo?: number;
  median_dom_12mo?: number;
  top_agents?: SuburbAgentContext[];
  demographics?: string;
}

export interface SaleContext {
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  sold_date: string;
}

export interface TopAgentContext {
  full_name: string;
  sales_count_12mo: number;
  avg_sale_price_12mo: number;
}

export interface SuburbAgentContext {
  full_name: string;
  agency_name: string;
  sales_count_suburb: number;
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

export interface VoiceEntityInfo {
  name: string;
  assistant_label?: string;
}
