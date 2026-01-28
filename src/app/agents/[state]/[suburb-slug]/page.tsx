import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, Building2, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AgentCard } from "@/components/agent/agent-card";
import FilterBar from "@/components/search/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import {
  getSuburbBySlug,
  getSuburbMarketStats,
  getAgentsList,
  getNearbySuburbs,
} from "@/lib/db/queries";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import { breadcrumbJsonLd, suburbJsonLd } from "@/lib/seo/jsonld";

const BASE_URL = "https://agentindex.com.au";

export const revalidate = 21600;

const STATES: Record<string, string> = {
  nsw: "New South Wales",
  vic: "Victoria",
  qld: "Queensland",
  wa: "Western Australia",
  sa: "South Australia",
  tas: "Tasmania",
  nt: "Northern Territory",
  act: "Australian Capital Territory",
};

const VALID_STATES = Object.keys(STATES);

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; "suburb-slug": string }>;
}): Promise<Metadata> {
  const { state, "suburb-slug": suburbSlug } = await params;
  const suburb = await getSuburbBySlug(suburbSlug);

  if (!suburb || !VALID_STATES.includes(state)) {
    return { title: "Not Found" };
  }

  const ogImageUrl = `${BASE_URL}/api/og?type=suburb&name=${encodeURIComponent(suburb.name)}&subtitle=${encodeURIComponent(state.toUpperCase())}`;

  return {
    title: `Real Estate Agents in ${suburb.name}, ${state.toUpperCase()}`,
    alternates: {
      // Canonical always points to page 1 default sort (no query params)
      canonical: `${BASE_URL}/agents/${state}/${suburbSlug}`,
    },
    openGraph: {
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Real Estate Agents in ${suburb.name}` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SuburbPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; "suburb-slug": string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    propertyType?: string | string[];
  }>;
}) {
  const { state, "suburb-slug": suburbSlug } = await params;
  const {
    page: pageParam,
    sort: sortParam,
    propertyType,
  } = await searchParams;

  if (!VALID_STATES.includes(state)) {
    notFound();
  }

  const suburb = await getSuburbBySlug(suburbSlug);
  if (!suburb) {
    notFound();
  }

  const fullStateName = STATES[state];
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const sort = (sortParam as "rating" | "sales" | "name" | "quality") ?? "sales";
  const limit = 20;

  const [marketStats, { agents, total }] = await Promise.all([
    getSuburbMarketStats(suburbSlug),
    getAgentsList({
      suburb: suburbSlug,
      sort,
      page: currentPage,
      limit,
      propertyType: Array.isArray(propertyType)
        ? propertyType[0]
        : propertyType,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Nearby suburbs — only if lat/lng exist
  const nearbySuburbs =
    suburb.lat != null && suburb.lng != null
      ? await getNearbySuburbs(suburb.lat, suburb.lng, 10, 7)
      : [];

  // Exclude current suburb from nearby list
  const filteredNearby = nearbySuburbs
    .filter((s) => s.slug !== suburb.slug)
    .slice(0, 6);

  // Build base path for pagination (preserve sort/filter params)
  const baseParts = [`/agents/${state}/${suburbSlug}`];
  const qsParts: string[] = [];
  if (sortParam) qsParts.push(`sort=${sortParam}`);
  if (propertyType) {
    const types = Array.isArray(propertyType) ? propertyType : [propertyType];
    types.forEach((t) => qsParts.push(`propertyType=${t}`));
  }
  const basePath =
    qsParts.length > 0
      ? `${baseParts[0]}?${qsParts.join("&")}`
      : baseParts[0];

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agents", url: `${BASE_URL}/agents` },
    { name: fullStateName, url: `${BASE_URL}/agents/${state}` },
    { name: suburb.name, url: `${BASE_URL}/agents/${state}/${suburbSlug}` },
  ]);

  const suburbData = suburbJsonLd(
    { name: suburb.name, state: state.toUpperCase() },
    agents.map((a) => a.fullName)
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(suburbData) }}
      />
      <Breadcrumb
        items={[
          { label: "Agents", href: "/agents" },
          { label: fullStateName, href: `/agents/${state}` },
          { label: suburb.name },
        ]}
        className="mb-6"
      />

      <h1 className="font-heading text-3xl md:text-4xl font-black mb-6">
        Real Estate Agents in {suburb.name}, {state.toUpperCase()}
      </h1>

      {/* Market stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Home}
          value={
            marketStats.medianHousePrice
              ? formatCurrency(marketStats.medianHousePrice)
              : "N/A"
          }
          label="Median House Price"
        />
        <StatCard
          icon={Building2}
          value={
            marketStats.medianUnitPrice
              ? formatCurrency(marketStats.medianUnitPrice)
              : "N/A"
          }
          label="Median Unit Price"
        />
        <StatCard
          icon={Users}
          value={formatNumber(marketStats.totalAgents)}
          label="Total Agents"
        />
      </div>

      {/* Filter bar */}
      <FilterBar totalResults={total} />

      {/* Agent list */}
      {agents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.slug}
              agent={{
                name: agent.fullName,
                slug: agent.slug,
                firstName: agent.firstName,
                lastName: agent.lastName,
                photoUrl: agent.photoUrl,
                rating: agent.ratingsAverage ?? undefined,
                totalSalesCount: agent.totalSalesCount ?? undefined,
                totalSalesVolume: agent.totalSalesVolume ?? undefined,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No agents found for this suburb yet.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </div>
      )}

      {/* Nearby suburbs */}
      {filteredNearby.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold mb-4">
            Nearby Suburbs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredNearby.map((nearby) => (
              <Link
                key={nearby.slug}
                href={`/agents/${nearby.state.toLowerCase()}/${nearby.slug}`}
                className="block"
              >
                <Card className="h-full text-center">
                  <CardContent>
                    <MapPin className="w-4 h-4 text-voqo-green mx-auto mb-1" />
                    <h3 className="font-bold text-sm truncate">
                      {nearby.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(nearby.totalAgents ?? 0)} agents
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
