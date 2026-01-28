import type { Metadata } from 'next';

const BASE_URL = 'https://agentindex.com.au';

type AgentMeta = {
  fullName: string;
  slug: string;
  suburb?: string;
  ratingsAverage?: number | null;
  totalSalesCount?: number;
};

type SuburbMeta = {
  name: string;
  state: string;
  slug: string;
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
  const location = agent.suburb ? ` in ${agent.suburb}` : '';
  const title = `${agent.fullName} - Real Estate Agent${location}`;
  const salesPart = agent.totalSalesCount
    ? ` with ${agent.totalSalesCount} sales`
    : '';
  const ratingPart =
    agent.ratingsAverage != null
      ? ` Rated ${agent.ratingsAverage.toFixed(1)}/5.`
      : '';
  const description = `${agent.fullName} is a real estate agent${salesPart}.${ratingPart} Compare performance and reviews on AgentIndex.`;

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
  const title = `Real Estate Agents in ${suburb.name}, ${stateUpper}`;
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
  const title = `${agency.name} - Real Estate Agency`;
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
  const title = `Real Estate Agents in ${state.name}`;
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
      default: 'AgentIndex \u2014 Find Real Estate Agents in Australia',
      template: '%s | AgentIndex',
    },
    description:
      "Australia's most comprehensive real estate agent directory. Compare agents by sales history, reviews, and verified credentials.",
    openGraph: {
      title: 'AgentIndex \u2014 Find Real Estate Agents in Australia',
      description:
        "Australia's most comprehensive real estate agent directory. Compare agents by sales history, reviews, and verified credentials.",
      url: BASE_URL,
      siteName: 'AgentIndex',
      type: 'website',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AgentIndex \u2014 Find Real Estate Agents in Australia',
      description:
        "Australia's most comprehensive real estate agent directory.",
    },
    alternates: {
      canonical: BASE_URL,
    },
  };
}
