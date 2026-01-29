import { NextRequest, NextResponse } from 'next/server';

import { createSignedUrl, isElevenLabsConfigured } from '@/lib/voice/elevenlabs';
import {
  getSiteStats,
  getAgentBySlug,
  getAgencyBySlug,
  getSuburbBySlug,
  getTopAgentsInSuburb,
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
    if (!body || !body.page_type) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'page_type is required', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    const validPageTypes = ['home', 'agent', 'agency', 'suburb'];
    if (!validPageTypes.includes(body.page_type)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid page_type', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    const validModes = ['navigator', 'assistant'];
    if (body.voice_mode && !validModes.includes(body.voice_mode)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid voice_mode', code: 'BAD_REQUEST' },
        },
        { status: 400 }
      );
    }

    // Validate slug lengths to prevent abuse
    const slugFields = [body.agent_slug, body.agency_slug, body.suburb_slug].filter(Boolean);
    if (slugFields.some((s) => s && s.length > 200)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid slug', code: 'BAD_REQUEST' } },
        { status: 400 }
      );
    }

    const voiceMode = body.voice_mode || 'navigator';
    let systemPrompt = '';
    let firstMessage = '';
    let dynamicVariables: Record<string, unknown> = {};

    if (voiceMode === 'navigator') {
      // Navigator mode - site-wide guide
      systemPrompt = NAVIGATOR_SYSTEM_PROMPT;
      firstMessage = NAVIGATOR_FIRST_MESSAGE;

      // Get site stats for context
      const stats = await getSiteStats();
      const currentSlug = body.agent_slug || body.agency_slug || body.suburb_slug || '';
      dynamicVariables = {
        current_page: body.page_type,
        current_slug: currentSlug,
        total_agents: stats.totalAgents,
        total_suburbs: stats.totalSuburbs,
        total_agencies: stats.totalAgencies,
      };
    } else {
      // Assistant mode - page-specific
      if (body.page_type === 'agent') {
        const agentData = await fetchAgentContext(body.agent_slug);
        if (!agentData) {
          return NextResponse.json(
            { signedUrl: null, error: 'Agent not found' },
            { status: 404 }
          );
        }

        const agentContext = buildAgentContext(agentData);
        systemPrompt = buildAgentSystemPrompt(
          agentData.full_name,
          agentData.agency_name,
          agentContext
        );
        firstMessage = buildAgentFirstMessage(agentData.full_name);
        dynamicVariables = {
          agent_name: agentData.full_name,
          agency_name: agentData.agency_name,
          agent_context: agentContext,
        };
      } else if (body.page_type === 'agency') {
        const agencyData = await fetchAgencyContext(body.agency_slug);
        if (!agencyData) {
          return NextResponse.json(
            { signedUrl: null, error: 'Agency not found' },
            { status: 404 }
          );
        }

        const agencyContext = buildAgencyContext(agencyData);
        systemPrompt = buildAgencySystemPrompt(agencyData.name, agencyContext);
        firstMessage = buildAgencyFirstMessage(agencyData.name);
        dynamicVariables = {
          agency_name: agencyData.name,
          agency_context: agencyContext,
        };
      } else if (body.page_type === 'suburb') {
        const suburbData = await fetchSuburbContext(body.suburb_slug);
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
        dynamicVariables = {
          suburb_name: suburbData.name,
          state: suburbData.state,
          suburb_context: suburbContext,
        };
      } else {
        // Home page assistant mode falls back to navigator
        systemPrompt = NAVIGATOR_SYSTEM_PROMPT;
        firstMessage = NAVIGATOR_FIRST_MESSAGE;
        const stats = await getSiteStats();
        dynamicVariables = {
          current_page: 'home',
          current_slug: '',
          total_agents: stats.totalAgents,
          total_suburbs: stats.totalSuburbs,
          total_agencies: stats.totalAgencies,
        };
      }
    }

    // Generate signed URL with session info
    const result = await createSignedUrl({
      systemPrompt,
      firstMessage,
      dynamicVariables,
    });

    // Return signedUrl, sessionId, expiresAt, overrides, dynamicVariables
    return NextResponse.json(
      {
        signedUrl: result.signedUrl,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
        overrides: result.overrides,
        dynamicVariables: result.dynamicVariables,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (e) {
    console.error('Voice signed-url error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
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
    full_name: agent.fullName,
    agency_name: agent.agency?.name ?? 'Independent Agent',
    years_experience: agent.yearsActive ?? undefined,
    languages: parseJsonArray(agent.languagesSpoken),
    specializations: parseJsonArray(agent.specializations),
    suburbs: agent.suburbs?.map((as) => as.suburb?.name).filter(Boolean) as string[] | undefined,
    sales_count_12mo: agent.totalSalesCount ?? undefined,
    avg_sale_price_12mo: agent.medianSalePrice ?? undefined,
    median_dom_12mo: agent.averageDaysOnMarket ?? undefined,
    rating: agent.ratingsAverage ?? undefined,
    review_count: agent.ratingsCount ?? undefined,
    recent_sales: agent.sales?.slice(0, 5).map((s) => ({
      address: s.propertyAddress,
      property_type: s.propertyType ?? 'property',
      bedrooms: s.bedrooms ?? 0,
      bathrooms: s.bathrooms ?? 0,
      price: s.salePrice ?? 0,
      sold_date: s.saleDate ?? '',
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
    agent_count: agency.totalAgents ?? undefined,
    sales_count_12mo: agency.totalSalesCount ?? undefined,
    total_volume_12mo: agency.totalSalesVolume ?? undefined,
    top_agents: agency.agents?.slice(0, 5).map((a) => ({
      full_name: a.fullName,
      sales_count_12mo: a.totalSalesCount ?? 0,
      avg_sale_price_12mo: a.medianSalePrice ?? 0,
    })),
    description: agency.description ?? undefined,
  };
}

// Helper to fetch suburb context from database
async function fetchSuburbContext(slug?: string): Promise<SuburbVoiceContext | null> {
  if (!slug) return null;

  const suburb = await getSuburbBySlug(slug);
  if (!suburb) return null;

  // Fetch top agents serving this suburb
  const topAgentsRaw = await getTopAgentsInSuburb(slug, 5);
  const topAgents = topAgentsRaw.map((a) => ({
    full_name: a.fullName,
    agency_name: a.agencyName,
    sales_count_suburb: a.salesCountSuburb,
    specializations: a.specializations,
    rating: a.rating,
  }));

  return {
    name: suburb.name,
    state: suburb.state,
    postcode: suburb.postcode,
    sales_count_12mo: suburb.salesVolume12m ?? undefined,
    median_house_price_12mo: suburb.medianHousePrice ?? undefined,
    median_apartment_price_12mo: suburb.medianUnitPrice ?? undefined,
    median_dom_12mo: suburb.avgDaysOnMarket ?? undefined,
    top_agents: topAgents,
  };
}
