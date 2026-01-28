const BASE_URL = 'https://agentindex.com.au';

export function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function agentJsonLd(agent: {
  fullName: string;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  agency?: { name: string } | null;
  ratingsAverage?: number | null;
  ratingsCount?: number;
  suburbsServiced?: string | null;
}): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.fullName,
  };

  if (agent.photoUrl) {
    schema.image = agent.photoUrl;
  }

  if (agent.phone) {
    schema.telephone = agent.phone;
  }

  if (agent.email) {
    schema.email = agent.email;
  }

  if (agent.agency?.name) {
    schema.worksFor = {
      '@type': 'Organization',
      name: agent.agency.name,
    };
  }

  if (agent.ratingsAverage != null && agent.ratingsCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: agent.ratingsAverage,
      bestRating: 5,
      worstRating: 1,
      ratingCount: agent.ratingsCount,
    };
  }

  if (agent.suburbsServiced) {
    try {
      const suburbs = JSON.parse(agent.suburbsServiced);
      if (Array.isArray(suburbs) && suburbs.length > 0) {
        schema.areaServed = suburbs.map((s: string) => ({
          '@type': 'Place',
          name: s,
        }));
      }
    } catch {
      // suburbsServiced not valid JSON, skip
    }
  }

  return schema;
}

export function agencyJsonLd(agency: {
  name: string;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  streetAddress?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  totalAgents?: number;
}): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agency.name,
  };

  if (agency.phone) {
    schema.telephone = agency.phone;
  }

  if (agency.email) {
    schema.email = agency.email;
  }

  if (agency.websiteUrl) {
    schema.url = agency.websiteUrl;
  }

  const hasAddress =
    agency.streetAddress || agency.suburb || agency.state || agency.postcode;
  if (hasAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(agency.streetAddress && { streetAddress: agency.streetAddress }),
      ...(agency.suburb && { addressLocality: agency.suburb }),
      ...(agency.state && { addressRegion: agency.state }),
      ...(agency.postcode && { postalCode: agency.postcode }),
      addressCountry: 'AU',
    };
  }

  if (agency.totalAgents && agency.totalAgents > 0) {
    schema.numberOfEmployees = {
      '@type': 'QuantitativeValue',
      value: agency.totalAgents,
    };
  }

  return schema;
}

export function suburbJsonLd(
  suburb: { name: string; state: string },
  agentNames: string[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Real Estate Agents in ${suburb.name}, ${suburb.state}`,
    numberOfItems: agentNames.length,
    itemListElement: agentNames.map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'RealEstateAgent',
        name,
      },
    })),
  };
}

export function homeJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AgentIndex',
    url: BASE_URL,
    description:
      "Australia's most comprehensive real estate agent directory.",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/agents?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
