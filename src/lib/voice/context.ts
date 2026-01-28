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

  lines.push(`Name: ${agent.fullName}`);
  lines.push(`Agency: ${agent.agencyName}`);

  if (agent.yearsExperience) {
    lines.push(`Years experience: ${agent.yearsExperience}`);
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
    agent.salesCount12mo ||
    agent.avgSalePrice12mo ||
    agent.medianDom12mo ||
    agent.rating;

  if (hasPerformanceData) {
    lines.push('');
    lines.push('Performance (12 months):');

    if (agent.salesCount12mo) {
      lines.push(`- Total sales: ${agent.salesCount12mo}`);
    }
    if (agent.avgSalePrice12mo) {
      lines.push(
        `- Average sale price: $${agent.avgSalePrice12mo.toLocaleString()}`
      );
    }
    if (agent.medianDom12mo) {
      lines.push(`- Median days on market: ${agent.medianDom12mo}`);
    }
    if (agent.rating !== undefined) {
      lines.push(
        `- Rating: ${agent.rating}/5${agent.reviewCount ? ` (${agent.reviewCount} reviews)` : ''}`
      );
    }
  }

  // Recent sales
  if (agent.recentSales && agent.recentSales.length > 0) {
    lines.push('');
    lines.push('Recent sales:');
    agent.recentSales.slice(0, 5).forEach((sale) => {
      lines.push(
        `- ${sale.address} — ${sale.propertyType}, ${sale.bedrooms}bed/${sale.bathrooms}bath — $${sale.price.toLocaleString()} (${sale.soldDate})`
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

  if (agency.establishedYear) {
    lines.push(`Established: ${agency.establishedYear}`);
  }

  if (agency.agentCount) {
    lines.push(`Total agents: ${agency.agentCount}`);
  }

  if (agency.specializations && agency.specializations.length > 0) {
    lines.push(`Specializations: ${agency.specializations.join(', ')}`);
  }

  // Performance
  const hasPerformanceData =
    agency.salesCount12mo || agency.avgSalePrice12mo || agency.totalVolume12mo;

  if (hasPerformanceData) {
    lines.push('');
    lines.push('Performance (12 months):');

    if (agency.salesCount12mo) {
      lines.push(`- Total sales: ${agency.salesCount12mo}`);
    }
    if (agency.avgSalePrice12mo) {
      lines.push(
        `- Average sale price: $${agency.avgSalePrice12mo.toLocaleString()}`
      );
    }
    if (agency.totalVolume12mo) {
      lines.push(
        `- Total transaction value: $${agency.totalVolume12mo.toLocaleString()}`
      );
    }
  }

  // Top agents
  if (agency.topAgents && agency.topAgents.length > 0) {
    lines.push('');
    lines.push('Top agents:');
    agency.topAgents.slice(0, 5).forEach((agent) => {
      lines.push(
        `- ${agent.fullName}: ${agent.salesCount12mo} sales, $${agent.avgSalePrice12mo.toLocaleString()} avg`
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
    suburb.salesCount12mo ||
    suburb.medianHousePrice12mo ||
    suburb.medianApartmentPrice12mo ||
    suburb.medianDom12mo;

  if (hasMarketData) {
    lines.push('');
    lines.push('Market statistics (12 months):');

    if (suburb.salesCount12mo) {
      lines.push(`- Total sales: ${suburb.salesCount12mo}`);
    }
    if (suburb.medianHousePrice12mo) {
      lines.push(
        `- Median house price: $${suburb.medianHousePrice12mo.toLocaleString()}`
      );
    }
    if (suburb.medianApartmentPrice12mo) {
      lines.push(
        `- Median apartment price: $${suburb.medianApartmentPrice12mo.toLocaleString()}`
      );
    }
    if (suburb.medianDom12mo) {
      lines.push(`- Median days on market: ${suburb.medianDom12mo}`);
    }
  }

  // Top agents
  if (suburb.topAgents && suburb.topAgents.length > 0) {
    lines.push('');
    lines.push(`Top agents in ${suburb.name}:`);
    suburb.topAgents.slice(0, 10).forEach((agent) => {
      lines.push(
        `- ${agent.fullName} (${agent.agencyName}): ${agent.salesCountSuburb} sales, ${agent.specializations.join(', ')}, ${agent.rating}/5 rating`
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
