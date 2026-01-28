const BASE_URL = 'https://agentindex.com.au';

export function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

type AgentReview = {
  reviewerName?: string | null;
  overallRating: number;
  reviewText?: string | null;
  reviewDate?: Date | string | null;
};

export function agentJsonLd(agent: {
  slug: string;
  fullName: string;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  agency?: { name: string; slug?: string } | null;
  ratingsAverage?: number | null;
  ratingsCount?: number;
  suburbsServiced?: string | null;
  reviews?: AgentReview[];
}): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.fullName,
    url: `${BASE_URL}/agent/${agent.slug}`,
    jobTitle: 'Real Estate Agent',
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
      ...(agent.agency.slug && { url: `${BASE_URL}/agency/${agent.agency.slug}` }),
    };
  }

  if (agent.ratingsAverage != null && agent.ratingsCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: agent.ratingsAverage,
      bestRating: 5,
      worstRating: 1,
      reviewCount: agent.ratingsCount,
    };
  }

  // areaServed with City type
  if (agent.suburbsServiced) {
    try {
      const suburbs = JSON.parse(agent.suburbsServiced);
      if (Array.isArray(suburbs) && suburbs.length > 0) {
        schema.areaServed = suburbs.map((s: string) => ({
          '@type': 'City',
          name: s,
        }));
      }
    } catch {
      // suburbsServiced not valid JSON, skip
    }
  }

  // Reviews array
  if (agent.reviews && agent.reviews.length > 0) {
    schema.review = agent.reviews.slice(0, 10).map((r) => {
      let datePublished: string | undefined;
      if (r.reviewDate) {
        if (typeof r.reviewDate === 'string') {
          datePublished = r.reviewDate.split('T')[0];
        } else {
          datePublished = r.reviewDate.toISOString().split('T')[0];
        }
      }
      return {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.reviewerName || 'Anonymous',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.overallRating,
          bestRating: 5,
          worstRating: 1,
        },
        ...(r.reviewText && { reviewBody: r.reviewText }),
        ...(datePublished && { datePublished }),
      };
    });
  }

  return schema;
}

type AgencyAgent = {
  fullName: string;
  slug: string;
};

export function agencyJsonLd(agency: {
  slug: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  streetAddress?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  totalAgents?: number;
  agents?: AgencyAgent[];
  suburbsServed?: string[];
  ratingsAverage?: number | null;
  ratingsCount?: number;
}): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agency.name,
    url: `${BASE_URL}/agency/${agency.slug}`,
  };

  if (agency.phone) {
    schema.telephone = agency.phone;
  }

  if (agency.email) {
    schema.email = agency.email;
  }

  if (agency.websiteUrl) {
    schema.sameAs = agency.websiteUrl;
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

  // Aggregate rating
  if (agency.ratingsAverage != null && agency.ratingsCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: agency.ratingsAverage,
      bestRating: 5,
      worstRating: 1,
      reviewCount: agency.ratingsCount,
    };
  }

  // Employee array (agents)
  if (agency.agents && agency.agents.length > 0) {
    schema.employee = agency.agents.map((a) => ({
      '@type': 'Person',
      name: a.fullName,
      url: `${BASE_URL}/agent/${a.slug}`,
    }));
  }

  // areaServed (suburbs)
  if (agency.suburbsServed && agency.suburbsServed.length > 0) {
    schema.areaServed = agency.suburbsServed.map((s) => ({
      '@type': 'City',
      name: s,
    }));
  }

  return schema;
}

type SuburbAgent = {
  fullName: string;
  slug: string;
  ratingsAverage?: number | null;
  ratingsCount?: number;
};

export function suburbJsonLd(
  suburb: { name: string; state: string; slug: string },
  agents: SuburbAgent[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Real Estate Agents in ${suburb.name}, ${suburb.state}`,
    numberOfItems: agents.length,
    itemListElement: agents.map((agent, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'RealEstateAgent',
        name: agent.fullName,
        url: `${BASE_URL}/agent/${agent.slug}`,
        ...(agent.ratingsAverage != null &&
          agent.ratingsCount && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: agent.ratingsAverage,
              bestRating: 5,
              worstRating: 1,
              reviewCount: agent.ratingsCount,
            },
          }),
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
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
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

// Helper to generate agent breadcrumbs
export function agentBreadcrumbJsonLd(agent: {
  fullName: string;
  slug: string;
  agency?: { name: string; slug: string } | null;
}): object {
  const items = [
    { name: 'Home', url: BASE_URL },
    { name: 'Agents', url: `${BASE_URL}/agents` },
  ];

  if (agent.agency) {
    items.push({
      name: agent.agency.name,
      url: `${BASE_URL}/agency/${agent.agency.slug}`,
    });
  }

  items.push({
    name: agent.fullName,
    url: `${BASE_URL}/agent/${agent.slug}`,
  });

  return breadcrumbJsonLd(items);
}

// Helper to generate agency breadcrumbs
export function agencyBreadcrumbJsonLd(agency: {
  name: string;
  slug: string;
  state?: string | null;
}): object {
  const items = [
    { name: 'Home', url: BASE_URL },
    { name: 'Agencies', url: `${BASE_URL}/agencies` },
  ];

  if (agency.state) {
    items.push({
      name: agency.state.toUpperCase(),
      url: `${BASE_URL}/agencies?state=${agency.state.toLowerCase()}`,
    });
  }

  items.push({
    name: agency.name,
    url: `${BASE_URL}/agency/${agency.slug}`,
  });

  return breadcrumbJsonLd(items);
}
