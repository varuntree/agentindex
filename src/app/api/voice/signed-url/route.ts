import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/response';
import { createSignedUrl, isElevenLabsConfigured } from '@/lib/voice/elevenlabs';
import {
  getSiteStats,
  getAgentBySlug,
  getAgencyBySlug,
  getSuburbBySlug,
} from '@/lib/db/queries';
import {
  buildAgentContext,
  buildAgencyContext,
  buildSuburbContext,
} from '@/lib/voice/context';
import {
  NAVIGATOR_SYSTEM_PROMPT,
  NAVIGATOR_FIRST_MESSAGE,
  buildAgentSystemPrompt,
  buildAgentFirstMessage,
  buildAgencySystemPrompt,
  buildAgencyFirstMessage,
  buildSuburbSystemPrompt,
  buildSuburbFirstMessage,
} from '@/lib/voice/prompts';
import type {
  VoiceSessionRequest,
  AgentVoiceContext,
  AgencyVoiceContext,
  SuburbVoiceContext,
} from '@/lib/voice/types';

export async function POST(request: NextRequest) {
  try {
    // Check if ElevenLabs is configured
    if (!isElevenLabsConfigured()) {
      return NextResponse.json(
        { signedUrl: null, error: 'Voice service not configured' },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // Parse and validate request body
    const body = (await request.json().catch(() => null)) as VoiceSessionRequest | null;
    if (!body || !body.pageType) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'pageType is required', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    const validPageTypes = ['home', 'agent', 'agency', 'suburb'];
    if (!validPageTypes.includes(body.pageType)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid pageType', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    const validModes = ['navigator', 'assistant'];
    if (body.voiceMode && !validModes.includes(body.voiceMode)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid voiceMode', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    const voiceMode = body.voiceMode || 'navigator';
    let systemPrompt = '';
    let variables: Record<string, unknown> = {};
    let firstMessage = '';

    if (voiceMode === 'navigator') {
      // Navigator mode - site-wide guide
      systemPrompt = NAVIGATOR_SYSTEM_PROMPT;
      firstMessage = NAVIGATOR_FIRST_MESSAGE;

      // Get site stats for context
      const stats = await getSiteStats();
      variables = {
        current_page: body.pageType,
        current_slug: body.slug || '',
        total_agents: stats.totalAgents,
        total_suburbs: stats.totalSuburbs,
        total_agencies: stats.totalAgencies,
      };
    } else {
      // Assistant mode - page-specific
      if (body.pageType === 'agent') {
        const agentData = body.contextData?.agent || await fetchAgentContext(body.slug);
        if (!agentData) {
          return NextResponse.json(
            { signedUrl: null, error: 'Agent not found' },
            { status: 404 }
          );
        }

        const agentContext = buildAgentContext(agentData);
        systemPrompt = buildAgentSystemPrompt(
          agentData.fullName,
          agentData.agencyName,
          agentContext
        );
        firstMessage = buildAgentFirstMessage(agentData.fullName);
        variables = {
          agent_name: agentData.fullName,
          agency_name: agentData.agencyName,
          agent_context: agentContext,
        };
      } else if (body.pageType === 'agency') {
        const agencyData = body.contextData?.agency || await fetchAgencyContext(body.slug);
        if (!agencyData) {
          return NextResponse.json(
            { signedUrl: null, error: 'Agency not found' },
            { status: 404 }
          );
        }

        const agencyContext = buildAgencyContext(agencyData);
        systemPrompt = buildAgencySystemPrompt(agencyData.name, agencyContext);
        firstMessage = buildAgencyFirstMessage(agencyData.name);
        variables = {
          agency_name: agencyData.name,
          agency_context: agencyContext,
        };
      } else if (body.pageType === 'suburb') {
        const suburbData = body.contextData?.suburb || await fetchSuburbContext(body.slug);
        if (!suburbData) {
          return NextResponse.json(
            { signedUrl: null, error: 'Suburb not found' },
            { status: 404 }
          );
        }

        const suburbContext = buildSuburbContext(suburbData);
        systemPrompt = buildSuburbSystemPrompt(
          suburbData.name,
          suburbData.state,
          suburbContext
        );
        firstMessage = buildSuburbFirstMessage(suburbData.name);
        variables = {
          suburb_name: suburbData.name,
          state: suburbData.state,
          suburb_context: suburbContext,
        };
      } else {
        // Home page assistant mode falls back to navigator
        systemPrompt = NAVIGATOR_SYSTEM_PROMPT;
        firstMessage = NAVIGATOR_FIRST_MESSAGE;
        const stats = await getSiteStats();
        variables = {
          current_page: 'home',
          current_slug: '',
          total_agents: stats.totalAgents,
          total_suburbs: stats.totalSuburbs,
          total_agencies: stats.totalAgencies,
        };
      }
    }

    // Generate signed URL
    const signedUrl = await createSignedUrl({
      systemPrompt,
      variables,
      firstMessage,
    });

    return NextResponse.json(
      { signedUrl },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (e) {
    console.error('Voice signed-url error:', e);
    return serverError();
  }
}

// Helper to fetch agent context from database
async function fetchAgentContext(slug?: string): Promise<AgentVoiceContext | null> {
  if (!slug) return null;

  const agent = await getAgentBySlug(slug);
  if (!agent) return null;

  // Parse JSON fields stored as text
  const parseJsonArray = (val: string | null): string[] | undefined => {
    if (!val) return undefined;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      // If not JSON, try comma-separated
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  };

  return {
    fullName: agent.fullName,
    agencyName: agent.agency?.name ?? 'Independent Agent',
    yearsExperience: agent.yearsActive ?? undefined,
    languages: parseJsonArray(agent.languagesSpoken),
    specializations: parseJsonArray(agent.specializations),
    suburbs: agent.suburbs?.map((as) => as.suburb?.name).filter(Boolean) as string[] | undefined,
    salesCount12mo: agent.totalSalesCount ?? undefined,
    avgSalePrice12mo: agent.medianSalePrice ?? undefined,
    medianDom12mo: agent.averageDaysOnMarket ?? undefined,
    rating: agent.ratingsAverage ?? undefined,
    reviewCount: agent.ratingsCount ?? undefined,
    recentSales: agent.sales?.slice(0, 5).map((s) => ({
      address: s.propertyAddress,
      propertyType: s.propertyType ?? 'property',
      bedrooms: s.bedrooms ?? 0,
      bathrooms: s.bathrooms ?? 0,
      price: s.salePrice ?? 0,
      soldDate: s.saleDate ?? '',
    })),
    bio: agent.bio ?? undefined,
  };
}

// Helper to fetch agency context from database
async function fetchAgencyContext(slug?: string): Promise<AgencyVoiceContext | null> {
  if (!slug) return null;

  const agency = await getAgencyBySlug(slug);
  if (!agency) return null;

  // Build locations array from address fields
  const locations: string[] = [];
  if (agency.streetAddress) {
    const parts = [agency.streetAddress, agency.suburb, agency.state, agency.postcode]
      .filter(Boolean);
    if (parts.length > 0) {
      locations.push(parts.join(', '));
    }
  }

  return {
    name: agency.name,
    locations: locations.length > 0 ? locations : undefined,
    agentCount: agency.totalAgents ?? undefined,
    salesCount12mo: agency.totalSalesCount ?? undefined,
    totalVolume12mo: agency.totalSalesVolume ?? undefined,
    topAgents: agency.agents?.slice(0, 5).map((a) => ({
      fullName: a.fullName,
      salesCount12mo: a.totalSalesCount ?? 0,
      avgSalePrice12mo: a.medianSalePrice ?? 0,
    })),
    description: agency.description ?? undefined,
  };
}

// Helper to fetch suburb context from database
async function fetchSuburbContext(slug?: string): Promise<SuburbVoiceContext | null> {
  if (!slug) return null;

  const suburb = await getSuburbBySlug(slug);
  if (!suburb) return null;

  return {
    name: suburb.name,
    state: suburb.state,
    postcode: suburb.postcode,
    medianHousePrice12mo: suburb.medianHousePrice ?? undefined,
    medianApartmentPrice12mo: suburb.medianUnitPrice ?? undefined,
    topAgents: [], // Would need additional query to get top agents in suburb
  };
}
