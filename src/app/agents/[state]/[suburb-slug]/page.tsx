import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, Building2, Users, MapPin, Clock, TrendingUp, BarChart3, Bed, Bath, Calendar } from "lucide-react";
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
  getSuburbPricesByType,
  getNotableSalesInSuburb,
} from "@/lib/db/queries";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils/format";
import { breadcrumbJsonLd, suburbJsonLd, safeJsonLd } from "@/lib/seo/jsonld";
import { suburbMetadata } from "@/lib/seo/metadata";
import { VoiceContextSetterWrapper } from "@/components/voice/VoiceContextSetterWrapper";
import { SuburbVoiceButtonWrapper } from "@/components/voice/SuburbVoiceButtonWrapper";

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

  // Use suburbMetadata helper for consistent title/description
  const baseMeta = suburbMetadata({
    name: suburb.name,
    state: state,
    slug: suburb.slug,
    postcode: suburb.postcode ?? undefined,
    totalAgents: suburb.totalAgents ?? undefined,
  });

  const ogImageUrl = `${BASE_URL}/api/og?type=suburb&name=${encodeURIComponent(suburb.name)}&subtitle=${encodeURIComponent(state.toUpperCase())}`;

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
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
  const sort = (sortParam as "sales_count" | "avg_price" | "name") ?? "sales_count";
  const limit = 20;

  const [suburbStats, { agents, total }, pricesByType, notableSales] = await Promise.all([
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
    getSuburbPricesByType(suburb.name),
    getNotableSalesInSuburb(suburb.name),
  ]);

  const { marketStats, totalAgents: agentCountFromStats } = suburbStats;

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
    { name: suburb.name, state: state.toUpperCase(), slug: suburb.slug },
    agents.map((a) => ({
      fullName: a.fullName,
      slug: a.slug,
      ratingsAverage: a.ratingsAverage,
      ratingsCount: a.ratingsCount ?? undefined,
    }))
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(suburbData) }}
      />

      {/* Set voice context for personalized button label */}
      <VoiceContextSetterWrapper name={suburb.name} />

      <Breadcrumb
        items={[
          { label: "Agents", href: "/agents" },
          { label: fullStateName, href: `/agents/${state}` },
          { label: suburb.name },
        ]}
        className="mb-6"
      />

      {/* Header with postcode */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-black">
              Real Estate Agents in {suburb.name}, {state.toUpperCase()} {suburb.postcode}
            </h1>
            <p className="text-gray-600 mt-1">
              {formatNumber(agentCountFromStats || total)} real estate agents
            </p>
            {marketStats.priceChangeYoy !== null && (
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                <TrendingUp className={`w-4 h-4 ${marketStats.priceChangeYoy >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={marketStats.priceChangeYoy >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {marketStats.priceChangeYoy >= 0 ? '+' : ''}{marketStats.priceChangeYoy.toFixed(1)}%
                </span>
                <span>median price change (YoY)</span>
              </p>
            )}
          </div>
          <SuburbVoiceButtonWrapper suburbName={suburb.name} />
        </div>
      </div>

      {/* Market stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={Home}
          value={
            marketStats.medianPriceHouse
              ? formatCurrency(marketStats.medianPriceHouse)
              : "N/A"
          }
          label="Median House"
        />
        <StatCard
          icon={Building2}
          value={
            marketStats.medianPriceApartment
              ? formatCurrency(marketStats.medianPriceApartment)
              : "N/A"
          }
          label="Median Unit"
        />
        <StatCard
          icon={Users}
          value={formatNumber(agentCountFromStats || total)}
          label="Agents"
        />
        <StatCard
          icon={Clock}
          value={
            marketStats.avgDaysOnMarket
              ? `${Math.round(marketStats.avgDaysOnMarket)} days`
              : "N/A"
          }
          label="Avg Days on Market"
        />
        <StatCard
          icon={BarChart3}
          value={
            marketStats.salesVolume12m
              ? formatNumber(marketStats.salesVolume12m)
              : "N/A"
          }
          label="Sales (12mo)"
        />
        <StatCard
          icon={TrendingUp}
          value={
            marketStats.clearanceRate
              ? `${marketStats.clearanceRate.toFixed(1)}%`
              : "N/A"
          }
          label="Clearance Rate"
        />
      </div>

      {/* Suburb Stats Section (6.3.5, 6.3.6, 6.3.7) */}
      <section className="mb-10 border-2 border-black rounded-lg bg-white p-6">
        <h2 className="font-heading text-xl font-bold mb-4">
          Market Overview
        </h2>

        {/* 6.3.5 - Market overview paragraph */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {suburb.name} is a {marketStats.medianPriceHouse && marketStats.medianPriceHouse > 1500000 ? "prestigious" : "popular"} suburb in {suburb.localGovernmentArea || fullStateName}, {state.toUpperCase()}.
          {marketStats.medianPrice || marketStats.medianPriceHouse ? (
            <> The median sale price of {formatCurrency(marketStats.medianPrice || marketStats.medianPriceHouse || 0)} represents a {marketStats.priceChangeYoy !== null && marketStats.priceChangeYoy !== undefined ? (
              <>{Math.abs(marketStats.priceChangeYoy).toFixed(1)}% {marketStats.priceChangeYoy >= 0 ? "increase" : "decrease"}</>
            ) : "stable trend"} over the past year.</>
          ) : null}
          {marketStats.avgDaysOnMarket ? (
            <> Properties spend an average of {Math.round(marketStats.avgDaysOnMarket)} days on market.</>
          ) : null}
          {marketStats.salesVolume12m ? (
            <> With {formatNumber(marketStats.salesVolume12m)} sales recorded in the last 12 months, the area remains active for buyers and sellers.</>
          ) : null}
          {(agentCountFromStats || total) > 0 ? (
            <> There are {formatNumber(agentCountFromStats || total)} experienced real estate agents servicing {suburb.name}.</>
          ) : null}
        </p>

        {/* 6.3.6 - Price by property type table */}
        {pricesByType.some((p) => p.salesCount > 0) && (
          <div className="mb-6">
            <h3 className="font-heading text-lg font-semibold mb-3">
              Price by Property Type
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 pr-4 font-semibold">Type</th>
                    <th className="text-right py-2 px-4 font-semibold">Median Price</th>
                    <th className="text-right py-2 px-4 font-semibold">Sales Count</th>
                    <th className="text-right py-2 pl-4 font-semibold">Avg DOM</th>
                  </tr>
                </thead>
                <tbody>
                  {pricesByType.map((row) => (
                    <tr key={row.propertyType} className="border-b border-gray-200">
                      <td className="py-2 pr-4 font-medium">{row.propertyType}s</td>
                      <td className="text-right py-2 px-4">
                        {row.medianPrice ? formatCurrency(row.medianPrice) : "—"}
                      </td>
                      <td className="text-right py-2 px-4">
                        {row.salesCount > 0 ? formatNumber(row.salesCount) : "—"}
                      </td>
                      <td className="text-right py-2 pl-4">
                        {row.avgDaysOnMarket ? `${row.avgDaysOnMarket} days` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6.3.7 - Notable recent sales */}
        {notableSales.length > 0 && (
          <div>
            <h3 className="font-heading text-lg font-semibold mb-3">
              Notable Recent Sales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notableSales.map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  {sale.imageUrl ? (
                    <div className="aspect-video bg-gray-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sale.imageUrl}
                        alt={sale.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <Home className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm truncate" title={sale.address}>
                      {sale.address}
                    </p>
                    <p className="text-voqo-green font-bold text-lg">
                      {formatCurrency(sale.salePrice)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {sale.bedrooms != null && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3" /> {sale.bedrooms}
                        </span>
                      )}
                      {sale.bathrooms != null && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3 h-3" /> {sale.bathrooms}
                        </span>
                      )}
                      {sale.saleDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(sale.saleDate)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/agent/${sale.agentSlug}`}
                      className="text-xs text-gray-600 hover:text-voqo-green mt-2 block"
                    >
                      Sold by {sale.agentName}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

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
                ratingsCount: agent.ratingsCount ?? undefined,
                totalSalesCount: agent.totalSalesCount ?? undefined,
                totalSalesVolume: agent.totalSalesVolume ?? undefined,
                suburbs: [{ name: suburb.name, slug: suburb.slug, state: state.toUpperCase() }],
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
