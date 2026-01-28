import type { Metadata } from 'next';

const BASE_URL = 'https://agentindex.com.au';
const CURRENT_YEAR = 2026;

type AgentMeta = {
  fullName: string;
  slug: string;
  suburb?: string;
  ratingsAverage?: number | null;
  totalSalesCount?: number;
  agencyName?: string;
};

type SuburbMeta = {
  name: string;
  state: string;
  slug: string;
  postcode?: string;
  totalAgents?: number;
};

type AgencyMeta = {
  name: string;
  slug: string;
  suburb?: string;
  totalAgents?: number;
};

type StateMeta = {
  name: string;
  abbrev: string;
};

export function agentMetadata(agent: AgentMeta): Metadata {
  // Format: [Name] — Real Estate Agent | [Agency] | AgentIndex
  const agencyPart = agent.agencyName ? ` | ${agent.agencyName}` : '';
  const title = `${agent.fullName} — Real Estate Agent${agencyPart} | AgentIndex`;

  const location = agent.suburb ? ` in ${agent.suburb}` : '';
  const salesPart = agent.totalSalesCount
    ? ` with ${agent.totalSalesCount} sales`
    : '';
  const ratingPart =
    agent.ratingsAverage != null
      ? ` Rated ${agent.ratingsAverage.toFixed(1)}/5.`
      : '';
  const description = `${agent.fullName} is a real estate agent${location}${salesPart}.${ratingPart} Compare performance and reviews on AgentIndex.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/agent/${agent.slug}`,
      type: 'profile',
      images: [
        {
          url: `${BASE_URL}/api/og?type=agent&slug=${encodeURIComponent(agent.slug)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/agent/${agent.slug}`,
    },
  };
}

export function suburbMetadata(suburb: SuburbMeta): Metadata {
  const stateUpper = suburb.state.toUpperCase();
  const postcodePart = suburb.postcode ? ` ${suburb.postcode}` : '';
  // Format: Best Real Estate Agents in [Suburb], [State] [Postcode] — 2026 | AgentIndex
  const title = `Best Real Estate Agents in ${suburb.name}, ${stateUpper}${postcodePart} — ${CURRENT_YEAR} | AgentIndex`;

  const agentsPart = suburb.totalAgents
    ? `${suburb.totalAgents} real estate agents`
    : 'real estate agents';
  const description = `Find and compare ${agentsPart} in ${suburb.name}, ${suburb.state}. View sales history, reviews, and verified credentials.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/agents/${suburb.state.toLowerCase()}/${suburb.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/agents/${suburb.state.toLowerCase()}/${suburb.slug}`,
    },
  };
}

export function agencyMetadata(agency: AgencyMeta): Metadata {
  // Format: [Agency] — Agents, Reviews & Sales | AgentIndex
  const title = `${agency.name} — Agents, Reviews & Sales | AgentIndex`;

  const agentsPart = agency.totalAgents
    ? `has ${agency.totalAgents} agents`
    : 'is a real estate agency';
  const locationPart = agency.suburb ? ` based in ${agency.suburb}` : '';
  const description = `${agency.name} ${agentsPart}${locationPart}. Compare agent performance, sales history, and reviews.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/agency/${agency.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/agency/${agency.slug}`,
    },
  };
}

export function stateMetadata(state: StateMeta): Metadata {
  // Format: Real Estate Agents in [State] — 2026 | AgentIndex
  const title = `Real Estate Agents in ${state.name} — ${CURRENT_YEAR} | AgentIndex`;
  const description = `Browse and compare real estate agents across ${state.name} (${state.abbrev}). View sales history, ratings, and verified credentials on AgentIndex.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/agents/${state.abbrev.toLowerCase()}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/agents/${state.abbrev.toLowerCase()}`,
    },
  };
}

export function homeMetadata(): Metadata {
  return {
    title: {
      default: 'AgentIndex — Find Real Estate Agents in Australia',
      template: '%s | AgentIndex',
    },
    description:
      "Australia's most comprehensive real estate agent directory. Compare agents by sales history, reviews, and verified credentials.",
    openGraph: {
      title: 'AgentIndex — Find Real Estate Agents in Australia',
      description:
        "Australia's most comprehensive real estate agent directory. Compare agents by sales history, reviews, and verified credentials.",
      url: BASE_URL,
      siteName: 'AgentIndex',
      type: 'website',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AgentIndex — Find Real Estate Agents in Australia',
      description:
        "Australia's most comprehensive real estate agent directory.",
    },
    alternates: {
      canonical: BASE_URL,
    },
  };
}
