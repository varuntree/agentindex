import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { agents, suburbs, agencies } from '@/lib/db/schema';
import { gt } from 'drizzle-orm';

const BASE_URL = 'https://agentindex.com.au';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/agencies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }
  );

  // State pages
  const states = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];
  for (const state of states) {
    entries.push({
      url: `${BASE_URL}/agents/${state}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Agent pages
  try {
    const allAgents = db
      .select({ slug: agents.slug, updatedAt: agents.updatedAt })
      .from(agents)
      .all();

    for (const agent of allAgents) {
      entries.push({
        url: `${BASE_URL}/agent/${agent.slug}`,
        lastModified: agent.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // DB may be empty or unavailable
  }

  // Suburb pages (only suburbs with agents)
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

  // Agency pages
  try {
    const allAgencies = db
      .select({ slug: agencies.slug, updatedAt: agencies.updatedAt })
      .from(agencies)
      .all();

    for (const agency of allAgencies) {
      entries.push({
        url: `${BASE_URL}/agency/${agency.slug}`,
        lastModified: agency.updatedAt ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // DB may be empty or unavailable
  }

  return entries;
}
