/**
 * Pipeline event types for SSE streaming
 */

export type PipelineEventType =
  | 'init'
  | 'info'
  | 'phase'
  | 'main_agent'
  | 'sub_agent_start'
  | 'sub_agent'
  | 'sub_agent_error'
  | 'tool_call'
  | 'tool_result'
  | 'reasoning'
  | 'validation'
  | 'status'
  | 'agent_stored'
  | 'error'
  | 'complete';

export type PipelineRunStatus = 'running' | 'success' | 'partial_success' | 'error' | 'stopped';
export type SubAgentStatus = 'running' | 'success' | 'error';

export interface PipelineValidationEvent {
  scope: 'agency' | 'team' | 'enrichment' | 'storage';
  ok: boolean;
  summary: string;
  details?: unknown;
}

export interface PipelineRunStats {
  agenciesFound: number;
  agentsFound: number;
  salesFound: number;
  reviewsFound: number;
  agentsNeeded?: number;
}

export interface PipelineRunStatusEvent {
  status: PipelineRunStatus;
  message?: string;
  phase?: number;
  stats?: PipelineRunStats;
}

export interface PipelineSubAgentStatusEvent {
  status: SubAgentStatus;
  goals: string[];
  agentNames: string[];
  message?: string;
}

export interface PipelineEvent {
  id: number;
  timestamp: number;
  runId: number;
  type: PipelineEventType;
  phase?: number;
  subAgentId?: number;
  agentNames?: string[];
  message?: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  reasoning?: string;
  validation?: PipelineValidationEvent;
  error?: string;
  agentName?: string;
  sdkMessage?: unknown;
  stats?: PipelineRunStats;
  runStatus?: PipelineRunStatusEvent;
  subAgentStatus?: PipelineSubAgentStatusEvent;
  payloadJson?: string;
}

export interface PipelineRequest {
  location: string;
  agencies: {
    agencyName: string;
    limit: number; // max 200 per agency
  }[];
}

export interface PipelineStatus {
  running: boolean;
  runId?: number;
  phase?: number;
  agentsProcessed: number;
  agentsTotal: number;
  subAgentsActive: number;
  startedAt?: string;
  errors: string[];
}

// Agent stub from team discovery
export interface AgentStub {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  profileUrl?: string;
  role?: string;
}

// Enriched agent output
export interface EnrichedAgent {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  bio?: string;
  yearsActive?: number;
  languagesSpoken?: string[];
  specializations?: string[];
  suburbsServiced: string[];
  phone?: string;
  email?: string;
  sales?: SaleOutput[];
  reviews?: ReviewOutput[];
}

export interface SaleOutput {
  propertyAddress: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  propertyType?: string;
  salePrice?: number;
  saleDate?: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
}

export interface ReviewOutput {
  overallRating: number;
  reviewText?: string;
  reviewerName?: string;
  reviewDate?: string;
  sourcePlatform?: string;
}

export interface AgencyBasic {
  id?: number;
  name: string;
  brandName?: string;
  websiteUrl?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  suburb: string;
  state: string;
  postcode: string;
}
