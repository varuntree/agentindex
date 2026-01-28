import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { agents, suburbs, agencies } from '@/lib/db/schema';
import { gt } from 'drizzle-orm';

const BASE_URL = 'https://agentindex.com.au';

// Sitemap IDs: 0=static, 1=agents, 2=suburbs, 3=agencies
const SITEMAP_STATIC = 0;
const SITEMAP_AGENTS = 1;
const SITEMAP_SUBURBS = 2;
const SITEMAP_AGENCIES = 3;

export async function generateSitemaps() {
  return [
    { id: SITEMAP_STATIC },
    { id: SITEMAP_AGENTS },
    { id: SITEMAP_SUBURBS },
    { id: SITEMAP_AGENCIES },
  ];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  switch (id) {
    case SITEMAP_STATIC:
      return generateStaticSitemap();
    case SITEMAP_AGENTS:
      return generateAgentsSitemap();
    case SITEMAP_SUBURBS:
      return generateSuburbsSitemap();
    case SITEMAP_AGENCIES:
      return generateAgenciesSitemap();
    default:
      return [];
  }
}

function generateStaticSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const states = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];

  // Homepage
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  });

  // Agents hub
  entries.push({
    url: `${BASE_URL}/agents`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  });

  // Agencies hub
  entries.push({
    url: `${BASE_URL}/agencies`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.5,
  });

  // State pages
  for (const state of states) {
    entries.push({
      url: `${BASE_URL}/agents/${state}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  return entries;
}

function generateAgentsSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const allAgents = db
      .select({ slug: agents.slug, updatedAt: agents.updatedAt })
      .from(agents)
      .all();

    for (const agent of allAgents) {
      entries.push({
        url: `${BASE_URL}/agent/${agent.slug}`,
        lastModified: agent.updatedAt ?? new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  } catch {
    // DB may be empty or unavailable
  }

  return entries;
}

function generateSuburbsSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const allSuburbs = db
      .select({
        slug: suburbs.slug,
        state: suburbs.state,
        updatedAt: suburbs.updatedAt,
      })
      .from(suburbs)
      .where(gt(suburbs.totalAgents, 0))
      .all();

    for (const suburb of allSuburbs) {
      entries.push({
        url: `${BASE_URL}/agents/${suburb.state.toLowerCase()}/${suburb.slug}`,
        lastModified: suburb.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  } catch {
    // DB may be empty or unavailable
  }

  return entries;
}

function generateAgenciesSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const allAgencies = db
      .select({ slug: agencies.slug, updatedAt: agencies.updatedAt })
      .from(agencies)
      .all();

    for (const agency of allAgencies) {
      entries.push({
        url: `${BASE_URL}/agency/${agency.slug}`,
        lastModified: agency.updatedAt ?? new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch {
    // DB may be empty or unavailable
  }

  return entries;
}
