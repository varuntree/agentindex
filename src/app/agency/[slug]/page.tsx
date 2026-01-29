import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, Globe, Users, BarChart3, DollarSign, TrendingUp, MapPin, Home, Calendar, Building2 } from "lucide-react";
import { AgentCard } from "@/components/agent/agent-card";
import { StatCard } from "@/components/ui/stat-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getAgencyBySlug, getAgencyEnrichment, getAgencyRecentSales } from "@/lib/db/queries";
import {
  formatCurrency,
  formatCompactPrice,
  formatNumber,
  formatDate,
} from "@/lib/utils/format";
import { agencyBreadcrumbJsonLd, agencyJsonLd, safeJsonLd } from "@/lib/seo/jsonld";
import { agencyMetadata } from "@/lib/seo/metadata";
import { VoiceContextSetterWrapper } from "@/components/voice/VoiceContextSetterWrapper";
import { AgencyVoiceButtonWrapper } from "@/components/voice/AgencyVoiceButtonWrapper";

const BASE_URL = "https://agentindex.com.au";

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);

  if (!agency) {
    return { title: "Agency Not Found" };
  }

  // Use agencyMetadata helper for consistent title/description
  const baseMeta = agencyMetadata({
    name: agency.name,
    slug: agency.slug,
    suburb: agency.suburb ?? undefined,
    totalAgents: agency.totalAgents ?? undefined,
  });

  const stats = [
    agency.totalAgents ? `${agency.totalAgents}:agents` : "",
    agency.totalSalesCount ? `${formatNumber(agency.totalSalesCount)}:sales` : "",
  ]
    .filter(Boolean)
    .join("|");

  const ogImageUrl = `${BASE_URL}/api/og?type=agency&name=${encodeURIComponent(agency.name)}&subtitle=${encodeURIComponent(agency.suburb || "")}&stats=${encodeURIComponent(stats)}`;

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: agency.name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AgencyProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;

  const agency = await getAgencyBySlug(slug);

  if (!agency) {
    notFound();
  }

  // Fetch enrichment data and recent sales in parallel
  const [enrichment, recentSalesData] = await Promise.all([
    getAgencyEnrichment(agency.id),
    getAgencyRecentSales(agency.id, 20),
  ]);

  // Sort agents based on query param (6.4.4)
  const agentSort = (sortParam as string) || "sales";
  const agentsList = [...(agency.agents ?? [])].sort((a, b) => {
    switch (agentSort) {
      case "rating":
        return (b.ratingsAverage ?? 0) - (a.ratingsAverage ?? 0);
      case "name":
        return a.fullName.localeCompare(b.fullName);
      case "sales":
      default:
        return (b.totalSalesCount ?? 0) - (a.totalSalesCount ?? 0);
    }
  });

  // Build address for display
  const addressParts = [
    agency.streetAddress,
    agency.suburb,
    agency.state?.toUpperCase(),
    agency.postcode,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  const breadcrumbData = agencyBreadcrumbJsonLd({
    name: agency.name,
    slug: agency.slug,
    state: agency.state,
  });

  // Collect unique suburbs from agents for areaServed
  const suburbsServed = [...new Set(
    agentsList.flatMap(a => {
      try {
        const suburbs = a.suburbsServiced ? JSON.parse(a.suburbsServiced) : [];
        return Array.isArray(suburbs) ? suburbs : [];
      } catch {
        return [];
      }
    })
  )].slice(0, 20);

  const agencyData = agencyJsonLd({
    slug: agency.slug,
    name: agency.name,
    phone: agency.phone,
    email: agency.email,
    websiteUrl: agency.websiteUrl,
    streetAddress: agency.streetAddress,
    suburb: agency.suburb,
    state: agency.state,
    postcode: agency.postcode,
    totalAgents: agency.totalAgents ?? 0,
    agents: agentsList.map(a => ({ fullName: a.fullName, slug: a.slug })),
    suburbsServed,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(agencyData) }}
      />

      {/* Set voice context for personalized button label */}
      <VoiceContextSetterWrapper name={agency.name} />

      <Breadcrumb
        items={[
          { label: "Agencies", href: "/agencies" },
          { label: agency.name },
        ]}
        className="mb-6"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-4">
          {/* Agency Logo (6.4.1) */}
          {agency.logoUrl ? (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agency.logoUrl}
                alt={`${agency.name} logo`}
                className="max-h-[150px] max-w-[300px] object-contain border-2 border-black rounded-lg p-2 bg-white"
              />
            </div>
          ) : (
            <div className="shrink-0 w-[150px] h-[100px] bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
          )}
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-black mb-4">
              {agency.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-voqo-green transition-colors"
            >
              <Phone className="w-4 h-4" />
              {agency.phone}
            </a>
          )}
          {agency.email && (
            <a
              href={`mailto:${agency.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-voqo-green transition-colors"
            >
              <Mail className="w-4 h-4" />
              {agency.email}
            </a>
          )}
          {agency.websiteUrl && (
            <a
              href={agency.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-voqo-green transition-colors"
            >
              <Globe className="w-4 h-4" />
              Website
            </a>
          )}
          <AgencyVoiceButtonWrapper agencyName={agency.name} />
        </div>

        {fullAddress && (
          <p className="text-sm text-gray-500 mb-6">{fullAddress}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          <StatCard
            icon={Users}
            value={formatNumber(agency.totalAgents ?? 0)}
            label="Total Agents"
          />
          <StatCard
            icon={BarChart3}
            value={formatNumber(agency.totalSalesCount ?? 0)}
            label="Total Sales"
          />
          <StatCard
            icon={DollarSign}
            value={formatCompactPrice(agency.totalSalesVolume ?? 0)}
            label="Total Volume"
          />
          <StatCard
            icon={TrendingUp}
            value={enrichment.avgSalePrice ? formatCompactPrice(enrichment.avgSalePrice) : "-"}
            label="Avg Sale Price"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Agent Roster (6.4.4 - with sort controls)                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-heading text-xl font-bold">Agent Roster</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <div className="flex gap-1">
              <Link
                href={`/agency/${slug}?sort=sales`}
                className={`px-3 py-1 text-sm rounded-full border-2 transition-colors ${
                  agentSort === "sales"
                    ? "bg-voqo-green text-white border-voqo-green"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                Sales Count
              </Link>
              <Link
                href={`/agency/${slug}?sort=rating`}
                className={`px-3 py-1 text-sm rounded-full border-2 transition-colors ${
                  agentSort === "rating"
                    ? "bg-voqo-green text-white border-voqo-green"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                Rating
              </Link>
              <Link
                href={`/agency/${slug}?sort=name`}
                className={`px-3 py-1 text-sm rounded-full border-2 transition-colors ${
                  agentSort === "name"
                    ? "bg-voqo-green text-white border-voqo-green"
                    : "border-gray-300 hover:border-black"
                }`}
              >
                Name A-Z
              </Link>
            </div>
          </div>
        </div>

        {agentsList.length === 0 ? (
          <p className="text-gray-500">No agents listed.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentsList.map((agent) => (
              <AgentCard
                key={agent.slug}
                agent={{
                  name: agent.fullName,
                  slug: agent.slug,
                  firstName: agent.firstName,
                  lastName: agent.lastName,
                  agencyName: agency.name,
                  agencySlug: agency.slug,
                  photoUrl: agent.photoUrl,
                  rating: agent.ratingsAverage ?? undefined,
                  ratingsCount: agent.ratingsCount ?? undefined,
                  totalSalesCount: agent.totalSalesCount ?? undefined,
                  totalSalesVolume: agent.totalSalesVolume ?? undefined,
                  suburbs: agency.state ? [{ name: agency.suburb ?? "", slug: "", state: agency.state.toUpperCase() }] : undefined,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Top Suburbs Covered (6.4.6)                                         */}
      {/* ------------------------------------------------------------------ */}
      {enrichment.topSuburbs.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4">Top Suburbs Covered</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Suburb</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Agents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichment.topSuburbs.map((suburb, index) => (
                    <TableRow key={`${suburb.name}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-voqo-green" />
                          {suburb.name}
                        </div>
                      </TableCell>
                      <TableCell>{suburb.state.toUpperCase()}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(suburb.agentCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Recent Sales (6.4.7) - Individual property sales                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">Recent Sales</h2>

        {recentSalesData.length === 0 ? (
          <p className="text-gray-500">No sales recorded.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSalesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium max-w-[250px]">
                        <div className="flex items-start gap-2">
                          <Home className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="truncate">
                            <span className="block truncate" title={sale.address}>
                              {sale.address}
                            </span>
                            {sale.suburb && (
                              <span className="text-xs text-gray-500">{sale.suburb}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/agent/${agentsList.find(a => a.id === sale.agentId)?.slug ?? '#'}`}
                          className="hover:text-voqo-green transition-colors text-sm"
                        >
                          {sale.agentName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-semibold text-voqo-green">
                        {sale.salePrice ? formatCurrency(sale.salePrice) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {sale.saleDate ? formatDate(sale.saleDate) : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.propertyType || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
