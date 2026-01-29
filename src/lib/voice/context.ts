/**
 * Context builders for voice prompts
 */

import type {
  AgentVoiceContext,
  AgencyVoiceContext,
  SuburbVoiceContext,
} from './types';

/**
 * Build agent context string for voice prompt
 */
export function buildAgentContext(agent: AgentVoiceContext): string {
  const lines: string[] = [];

  lines.push(`Name: ${agent.full_name}`);
  lines.push(`Agency: ${agent.agency_name}`);

  if (agent.years_experience) {
    lines.push(`Years experience: ${agent.years_experience}`);
  }

  if (agent.languages && agent.languages.length > 0) {
    lines.push(`Languages: ${agent.languages.join(', ')}`);
  }

  if (agent.specializations && agent.specializations.length > 0) {
    lines.push(`Specializations: ${agent.specializations.join(', ')}`);
  }

  if (agent.suburbs && agent.suburbs.length > 0) {
    lines.push(`Suburbs covered: ${agent.suburbs.join(', ')}`);
  }

  // Performance section
  const hasPerformanceData =
    agent.sales_count_12mo ||
    agent.avg_sale_price_12mo ||
    agent.median_dom_12mo ||
    agent.rating;

  if (hasPerformanceData) {
    lines.push('');
    lines.push('Performance (12 months):');

    if (agent.sales_count_12mo) {
      lines.push(`- Total sales: ${agent.sales_count_12mo}`);
    }
    if (agent.avg_sale_price_12mo) {
      lines.push(
        `- Average sale price: $${agent.avg_sale_price_12mo.toLocaleString()}`
      );
    }
    if (agent.median_dom_12mo) {
      lines.push(`- Median days on market: ${agent.median_dom_12mo}`);
    }
    if (agent.rating !== undefined) {
      lines.push(
        `- Rating: ${agent.rating}/5${agent.review_count ? ` (${agent.review_count} reviews)` : ''}`
      );
    }
  }

  // Recent sales
  if (agent.recent_sales && agent.recent_sales.length > 0) {
    lines.push('');
    lines.push('Recent sales:');
    agent.recent_sales.slice(0, 5).forEach((sale) => {
      lines.push(
        `- ${sale.address} — ${sale.property_type}, ${sale.bedrooms}bed/${sale.bathrooms}bath — $${sale.price.toLocaleString()} (${sale.sold_date})`
      );
    });
  }

  // Bio
  if (agent.bio) {
    lines.push('');
    lines.push(`Bio: ${agent.bio}`);
  }

  return lines.join('\n');
}

/**
 * Build agency context string for voice prompt
 */
export function buildAgencyContext(agency: AgencyVoiceContext): string {
  const lines: string[] = [];

  lines.push(`Agency: ${agency.name}`);

  if (agency.locations && agency.locations.length > 0) {
    lines.push(`Locations: ${agency.locations.join(', ')}`);
  }

  if (agency.established_year) {
    lines.push(`Established: ${agency.established_year}`);
  }

  if (agency.agent_count) {
    lines.push(`Total agents: ${agency.agent_count}`);
  }

  if (agency.specializations && agency.specializations.length > 0) {
    lines.push(`Specializations: ${agency.specializations.join(', ')}`);
  }

  // Performance
  const hasPerformanceData =
    agency.sales_count_12mo || agency.avg_sale_price_12mo || agency.total_volume_12mo;

  if (hasPerformanceData) {
    lines.push('');
    lines.push('Performance (12 months):');

    if (agency.sales_count_12mo) {
      lines.push(`- Total sales: ${agency.sales_count_12mo}`);
    }
    if (agency.avg_sale_price_12mo) {
      lines.push(
        `- Average sale price: $${agency.avg_sale_price_12mo.toLocaleString()}`
      );
    }
    if (agency.total_volume_12mo) {
      lines.push(
        `- Total transaction value: $${agency.total_volume_12mo.toLocaleString()}`
      );
    }
  }

  // Top agents
  if (agency.top_agents && agency.top_agents.length > 0) {
    lines.push('');
    lines.push('Top agents:');
    agency.top_agents.slice(0, 5).forEach((agent) => {
      lines.push(
        `- ${agent.full_name}: ${agent.sales_count_12mo} sales, $${agent.avg_sale_price_12mo.toLocaleString()} avg`
      );
    });
  }

  // Description
  if (agency.description) {
    lines.push('');
    lines.push(`About: ${agency.description}`);
  }

  return lines.join('\n');
}

/**
 * Build suburb context string for voice prompt
 */
export function buildSuburbContext(suburb: SuburbVoiceContext): string {
  const lines: string[] = [];

  lines.push(`Suburb: ${suburb.name}, ${suburb.state}`);
  lines.push(`Postcode: ${suburb.postcode}`);

  // Market statistics
  const hasMarketData =
    suburb.sales_count_12mo ||
    suburb.median_house_price_12mo ||
    suburb.median_apartment_price_12mo ||
    suburb.median_dom_12mo;

  if (hasMarketData) {
    lines.push('');
    lines.push('Market statistics (12 months):');

    if (suburb.sales_count_12mo) {
      lines.push(`- Total sales: ${suburb.sales_count_12mo}`);
    }
    if (suburb.median_house_price_12mo) {
      lines.push(
        `- Median house price: $${suburb.median_house_price_12mo.toLocaleString()}`
      );
    }
    if (suburb.median_apartment_price_12mo) {
      lines.push(
        `- Median apartment price: $${suburb.median_apartment_price_12mo.toLocaleString()}`
      );
    }
    if (suburb.median_dom_12mo) {
      lines.push(`- Median days on market: ${suburb.median_dom_12mo}`);
    }
  }

  // Top agents
  if (suburb.top_agents && suburb.top_agents.length > 0) {
    lines.push('');
    lines.push(`Top agents in ${suburb.name}:`);
    suburb.top_agents.slice(0, 10).forEach((agent) => {
      lines.push(
        `- ${agent.full_name} (${agent.agency_name}): ${agent.sales_count_suburb} sales, ${agent.specializations.join(', ')}, ${agent.rating}/5 rating`
      );
    });
  }

  // Demographics
  if (suburb.demographics) {
    lines.push('');
    lines.push(`Demographics: ${suburb.demographics}`);
  }

  return lines.join('\n');
}
