import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  MessageCircle,
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  Star,
  Bed,
  Bath,
  Car,
  Home,
  Gavel,
  Linkedin,
  Facebook,
  Instagram,
  Globe,
} from "lucide-react";
import { AgentPhoto } from "@/components/agent/agent-photo";
import { AgentCard } from "@/components/agent/agent-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DonutChart } from "@/components/ui/donut-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { Card, CardContent } from "@/components/ui/card";
import { SuburbBadge } from "@/components/ui/suburb-badge";
import { StarRating } from "@/components/ui/star-rating";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getAgentBySlug, getSimilarAgents } from "@/lib/db/queries";
import {
  formatCurrency,
  formatCompactPrice,
  formatNumber,
  formatDate,
  formatPercentage,
} from "@/lib/utils/format";
import { agentBreadcrumbJsonLd, agentJsonLd, safeJsonLd } from "@/lib/seo/jsonld";
import { agentMetadata } from "@/lib/seo/metadata";
import { VoiceContextSetterWrapper } from "@/components/voice/VoiceContextSetterWrapper";

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
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  const suburbName =
    agent.suburbs?.[0]?.suburb?.name ?? agent.licenseState ?? "Australia";

  // Use agentMetadata helper for consistent title/description
  const baseMeta = agentMetadata({
    fullName: agent.fullName,
    slug: agent.slug,
    suburb: suburbName,
    ratingsAverage: agent.ratingsAverage,
    totalSalesCount: agent.totalSalesCount ?? undefined,
    agencyName: agent.agency?.name,
  });

  const stats = [
    agent.totalSalesCount ? `${agent.totalSalesCount}:sales` : "",
    agent.ratingsAverage ? `${agent.ratingsAverage.toFixed(1)}:rating` : "",
  ]
    .filter(Boolean)
    .join("|");

  const ogImageUrl = `${BASE_URL}/api/og?type=agent&name=${encodeURIComponent(agent.fullName)}&subtitle=${encodeURIComponent(agent.agency?.name || "")}&stats=${encodeURIComponent(stats)}`;

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: agent.fullName }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AgentProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const salesPage = Number(sp.page) || 1;
  const salesPerPage = 20;
  const salesSort = (sp.salesSort as string) || "date";
  const salesType = (sp.salesType as string) || "all";

  // Filter and sort sales (6.2.4)
  let filteredSales = agent.sales ?? [];
  if (salesType !== "all") {
    filteredSales = filteredSales.filter(
      (s) => s.propertyType?.toLowerCase() === salesType.toLowerCase()
    );
  }

  // Sort sales
  const sortedSales = [...filteredSales].sort((a, b) => {
    switch (salesSort) {
      case "price_high":
        return (b.salePrice ?? 0) - (a.salePrice ?? 0);
      case "price_low":
        return (a.salePrice ?? 0) - (b.salePrice ?? 0);
      case "date":
      default:
        return (
          new Date(b.saleDate ?? 0).getTime() -
          new Date(a.saleDate ?? 0).getTime()
        );
    }
  });

  const totalSalesPages = Math.max(1, Math.ceil(sortedSales.length / salesPerPage));
  const paginatedSales = sortedSales.slice(
    (salesPage - 1) * salesPerPage,
    salesPage * salesPerPage
  );

  // Get unique property types for filter
  const propertyTypes = [...new Set((agent.sales ?? []).map((s) => s.propertyType).filter(Boolean))];

  // Reviews pagination (10/page per spec)
  const reviewPage = Number(sp.reviewPage) || 1;
  const reviewsPerPage = 10;
  const allReviews = agent.reviews ?? [];
  const totalReviewPages = Math.max(1, Math.ceil(allReviews.length / reviewsPerPage));
  const paginatedReviews = allReviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  );

  const suburbIds = (agent.suburbs ?? [])
    .map((s) => s.suburb?.id)
    .filter((id): id is number => id != null);
  const similarAgents =
    suburbIds.length > 0 ? await getSimilarAgents(agent.id, suburbIds, 6) : [];

  const languages: string[] = (() => {
    if (!agent.languagesSpoken) return [];
    try {
      return JSON.parse(agent.languagesSpoken);
    } catch {
      return [];
    }
  })();

  const breadcrumbData = agentBreadcrumbJsonLd({
    fullName: agent.fullName,
    slug: agent.slug,
    agency: agent.agency ? { name: agent.agency.name, slug: agent.agency.slug } : null,
  });

  const agentData = agentJsonLd({
    slug: agent.slug,
    fullName: agent.fullName,
    photoUrl: agent.photoUrl,
    phone: agent.phone,
    email: agent.email,
    agency: agent.agency ? { name: agent.agency.name, slug: agent.agency.slug } : null,
    ratingsAverage: agent.ratingsAverage,
    ratingsCount: agent.ratingsCount ?? undefined,
    suburbsServiced: agent.suburbsServiced,
    reviews: agent.reviews?.map(r => ({
      reviewerName: r.reviewerName,
      overallRating: r.overallRating,
      reviewText: r.reviewText,
      reviewDate: r.reviewDate,
    })),
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(agentData) }}
      />

      {/* Set voice context for personalized button label */}
      <VoiceContextSetterWrapper name={agent.fullName} />

      <Breadcrumb
        items={[
          { label: "Agents", href: "/agents" },
          { label: agent.fullName },
        ]}
        className="mb-6"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
        <AgentPhoto
          photoUrl={agent.photoUrl}
          firstName={agent.firstName}
          lastName={agent.lastName}
          size="xl"
        />

        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-3xl md:text-4xl font-black mb-2">
            {agent.fullName}
          </h1>

          {agent.agency && (
            <div className="flex items-center gap-3 mb-2">
              {agent.agency.logoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={agent.agency.logoUrl}
                  alt={`${agent.agency.name} logo`}
                  className="h-10 max-w-[100px] object-contain"
                />
              )}
              <Link
                href={`/agency/${agent.agency.slug}`}
                className="text-gray-600 hover:text-voqo-green transition-colors"
              >
                {agent.agency.name}
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {agent.licenseNumber && (
              <Badge
                variant="license"
                status={
                  agent.licenseStatus === "active"
                    ? "active"
                    : agent.licenseStatus === "expired"
                      ? "expired"
                      : "unknown"
                }
              >
                License: {agent.licenseNumber}
              </Badge>
            )}

            {agent.yearsActive != null && agent.yearsActive > 0 && (
              <span className="text-sm text-gray-500">
                {agent.yearsActive} year{agent.yearsActive !== 1 ? "s" : ""}{" "}
                active
              </span>
            )}

            {languages.length > 0 && (
              <span className="text-sm text-gray-500">
                Speaks {languages.join(", ")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-voqo-green transition-colors"
              >
                <Mail className="w-4 h-4" />
                {agent.email}
              </a>
            )}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-voqo-green transition-colors"
              >
                <Phone className="w-4 h-4" />
                {agent.phone}
              </a>
            )}
            {(agent.linkedinUrl || agent.facebookUrl || agent.instagramUrl || agent.websiteUrl) && (
              <div className="flex items-center gap-3">
                {agent.linkedinUrl && (
                  <a
                    href={agent.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-voqo-green transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {agent.facebookUrl && (
                  <a
                    href={agent.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-voqo-green transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {agent.instagramUrl && (
                  <a
                    href={agent.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-voqo-green transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {agent.websiteUrl && (
                  <a
                    href={agent.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-voqo-green transition-colors"
                    aria-label="Website"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
            <Button variant="primary" size="sm">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Talk to {agent.firstName}&apos;s Assistant
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Performance Stats                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">
          Performance Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={BarChart3}
            value={formatNumber(agent.totalSalesCount ?? 0)}
            label="Properties Sold (12mo)"
          />
          <StatCard
            icon={DollarSign}
            value={formatCompactPrice(agent.totalSalesVolume ?? 0)}
            label="Sales Volume"
          />
          <StatCard
            icon={TrendingUp}
            value={
              agent.medianSalePrice
                ? formatCompactPrice(agent.medianSalePrice)
                : "-"
            }
            label="Median Price"
          />
          <StatCard
            icon={Clock}
            value={
              agent.averageDaysOnMarket != null
                ? `${Math.round(agent.averageDaysOnMarket)}`
                : "-"
            }
            label="Avg Days on Market"
          />
          <StatCard
            icon={Target}
            value={
              agent.listingAccuracy != null
                ? formatPercentage(agent.listingAccuracy)
                : "-"
            }
            label="Listing Accuracy"
          />
          <StatCard
            icon={Star}
            value={
              agent.ratingsAverage != null
                ? agent.ratingsAverage.toFixed(1)
                : "-"
            }
            label="Rating"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Property Type Breakdown                                              */}
      {/* ------------------------------------------------------------------ */}
      {(() => {
        const propertyTypeCounts = (agent.sales ?? []).reduce((acc, sale) => {
          const type = sale.propertyType;
          if (type) {
            acc[type] = (acc[type] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const colorMap: Record<string, string> = {
          House: "#26C169",
          Unit: "#3B82F6",
          Land: "#F97316",
          Townhouse: "#8B5CF6",
        };

        const chartData = Object.entries(propertyTypeCounts).map(([label, value]) => ({
          label,
          value,
          color: colorMap[label],
        }));

        if (chartData.length === 0) return null;

        return (
          <section className="mb-10">
            <h2 className="font-heading text-xl font-bold mb-4">
              Property Type Breakdown
            </h2>
            <DonutChart data={chartData} />
          </section>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Suburbs Served                                                      */}
      {/* ------------------------------------------------------------------ */}
      {(agent.suburbs ?? []).length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4">
            Suburbs Served
          </h2>
          <div className="flex flex-wrap gap-2">
            {agent.suburbs.map((as, idx) =>
              as.suburb ? (
                <SuburbBadge
                  key={as.suburb.slug}
                  name={as.suburb.name}
                  slug={as.suburb.slug}
                  state={as.suburb.state}
                  isPrimary={idx === 0}
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sales History (6.2.4, 6.2.5, 6.2.6)                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-heading text-xl font-bold">Sales History</h2>

          {/* Sort & Filter Controls (6.2.4) */}
          {(agent.sales ?? []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Sort:</span>
                <Link
                  href={`/agent/${slug}?salesSort=date&salesType=${salesType}`}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    salesSort === "date"
                      ? "bg-voqo-green text-white border-voqo-green"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  Recent
                </Link>
                <Link
                  href={`/agent/${slug}?salesSort=price_high&salesType=${salesType}`}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    salesSort === "price_high"
                      ? "bg-voqo-green text-white border-voqo-green"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  Price ↓
                </Link>
                <Link
                  href={`/agent/${slug}?salesSort=price_low&salesType=${salesType}`}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    salesSort === "price_low"
                      ? "bg-voqo-green text-white border-voqo-green"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  Price ↑
                </Link>
              </div>

              {propertyTypes.length > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Type:</span>
                  <Link
                    href={`/agent/${slug}?salesSort=${salesSort}&salesType=all`}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      salesType === "all"
                        ? "bg-voqo-green text-white border-voqo-green"
                        : "border-gray-300 hover:border-black"
                    }`}
                  >
                    All
                  </Link>
                  {propertyTypes.slice(0, 4).map((type) => (
                    <Link
                      key={type}
                      href={`/agent/${slug}?salesSort=${salesSort}&salesType=${type?.toLowerCase()}`}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        salesType === type?.toLowerCase()
                          ? "bg-voqo-green text-white border-voqo-green"
                          : "border-gray-300 hover:border-black"
                      }`}
                    >
                      {type}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {sortedSales.length === 0 ? (
          <p className="text-gray-500">No sales recorded.</p>
        ) : (
          <>
            {/* Desktop: Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {sale.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={sale.imageUrl}
                              alt={sale.propertyAddress}
                              className="w-20 h-14 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-20 h-14 bg-gray-100 rounded border flex items-center justify-center">
                              <Home className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]" title={sale.propertyAddress}>
                              {sale.propertyAddress}
                            </p>
                            <p className="text-xs text-gray-500">{sale.propertyType ?? "Property"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-voqo-green">
                        {sale.salePrice ? formatCurrency(sale.salePrice) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.saleDate ? formatDate(sale.saleDate) : "-"}
                        {sale.daysOnMarket != null && (
                          <span className="block text-xs text-gray-500">
                            {sale.daysOnMarket} days on market
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {sale.bedrooms != null && (
                            <span className="flex items-center gap-0.5">
                              <Bed className="w-3 h-3" /> {sale.bedrooms}
                            </span>
                          )}
                          {sale.bathrooms != null && (
                            <span className="flex items-center gap-0.5">
                              <Bath className="w-3 h-3" /> {sale.bathrooms}
                            </span>
                          )}
                          {sale.carSpaces != null && (
                            <span className="flex items-center gap-0.5">
                              <Car className="w-3 h-3" /> {sale.carSpaces}
                            </span>
                          )}
                          {sale.bedrooms == null && sale.bathrooms == null && sale.carSpaces == null && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.saleMethod ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            sale.saleMethod.toLowerCase().includes("auction")
                              ? "bg-orange-100 text-orange-700"
                              : sale.saleMethod.toLowerCase().includes("private")
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}>
                            {sale.saleMethod.toLowerCase().includes("auction") && (
                              <Gavel className="w-3 h-3" />
                            )}
                            {sale.saleMethod}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: Card View (6.2.5) */}
            <div className="md:hidden grid gap-4">
              {paginatedSales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {sale.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={sale.imageUrl}
                          alt={sale.propertyAddress}
                          className="w-24 h-20 object-cover rounded border shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-20 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                          <Home className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-2">{sale.propertyAddress}</p>
                        <p className="text-voqo-green font-bold text-lg mt-1">
                          {sale.salePrice ? formatCurrency(sale.salePrice) : "-"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {sale.saleDate && <span>{formatDate(sale.saleDate)}</span>}
                          {sale.propertyType && <span>{sale.propertyType}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {sale.bedrooms != null && (
                          <span className="flex items-center gap-0.5">
                            <Bed className="w-3 h-3" /> {sale.bedrooms}
                          </span>
                        )}
                        {sale.bathrooms != null && (
                          <span className="flex items-center gap-0.5">
                            <Bath className="w-3 h-3" /> {sale.bathrooms}
                          </span>
                        )}
                        {sale.carSpaces != null && (
                          <span className="flex items-center gap-0.5">
                            <Car className="w-3 h-3" /> {sale.carSpaces}
                          </span>
                        )}
                      </div>
                      {sale.saleMethod && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sale.saleMethod.toLowerCase().includes("auction")
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {sale.saleMethod}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalSalesPages > 1 && (
              <Pagination
                currentPage={salesPage}
                totalPages={totalSalesPages}
                basePath={`/agent/${slug}?salesSort=${salesSort}&salesType=${salesType}`}
                className="mt-4 justify-center"
              />
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Reviews                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">Reviews</h2>

        {allReviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <StarRating
                rating={agent.ratingsAverage ?? 0}
                size="lg"
                showValue
              />
              <span className="text-gray-500 text-sm">
                ({agent.ratingsCount ?? allReviews.length} review
                {(agent.ratingsCount ?? allReviews.length) !== 1
                  ? "s"
                  : ""})
              </span>
              {(() => {
                const wouldHireCount = allReviews.filter((r) => r.overallRating >= 4).length;
                const wouldHirePercent = Math.round((wouldHireCount / allReviews.length) * 100);
                return (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    {wouldHirePercent}% Would Hire Again
                  </span>
                );
              })()}
            </div>

            {/* Sub-ratings bar chart */}
            {(() => {
              const reviewsWithSubRatings = allReviews.filter(
                (r) =>
                  r.communicationRating != null ||
                  r.knowledgeRating != null ||
                  r.negotiationRating != null
              );
              if (reviewsWithSubRatings.length === 0) return null;

              const avgCommunication =
                reviewsWithSubRatings.filter((r) => r.communicationRating != null).length > 0
                  ? reviewsWithSubRatings.reduce((sum, r) => sum + (r.communicationRating ?? 0), 0) /
                    reviewsWithSubRatings.filter((r) => r.communicationRating != null).length
                  : null;
              const avgKnowledge =
                reviewsWithSubRatings.filter((r) => r.knowledgeRating != null).length > 0
                  ? reviewsWithSubRatings.reduce((sum, r) => sum + (r.knowledgeRating ?? 0), 0) /
                    reviewsWithSubRatings.filter((r) => r.knowledgeRating != null).length
                  : null;
              const avgNegotiation =
                reviewsWithSubRatings.filter((r) => r.negotiationRating != null).length > 0
                  ? reviewsWithSubRatings.reduce((sum, r) => sum + (r.negotiationRating ?? 0), 0) /
                    reviewsWithSubRatings.filter((r) => r.negotiationRating != null).length
                  : null;

              const subRatingsData = [
                avgCommunication != null && { label: "Communication", value: avgCommunication },
                avgKnowledge != null && { label: "Knowledge", value: avgKnowledge },
                avgNegotiation != null && { label: "Negotiation", value: avgNegotiation },
              ].filter(Boolean) as { label: string; value: number }[];

              if (subRatingsData.length === 0) return null;

              return (
                <div className="max-w-md mb-6">
                  <BarChart data={subRatingsData} />
                </div>
              );
            })()}

            <div className="space-y-4">
              {paginatedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border-2 border-black rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {review.reviewerName ?? "Anonymous"}
                      </span>
                      {review.reviewerType && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            review.reviewerType.toLowerCase() === "buyer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {review.reviewerType.charAt(0).toUpperCase() +
                            review.reviewerType.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                    {review.reviewDate && (
                      <span className="text-xs text-gray-500">
                        {formatDate(review.reviewDate)}
                      </span>
                    )}
                  </div>
                  <StarRating
                    rating={review.overallRating}
                    size="sm"
                    className="mb-2"
                  />
                  {review.reviewText && (
                    <p className="text-sm text-gray-700">{review.reviewText}</p>
                  )}
                </div>
              ))}
            </div>

            {totalReviewPages > 1 && (
              <Pagination
                currentPage={reviewPage}
                totalPages={totalReviewPages}
                basePath={`/agent/${slug}?reviewPage=`}
                className="mt-4 justify-center"
              />
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Similar Agents                                                      */}
      {/* ------------------------------------------------------------------ */}
      {similarAgents.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4">
            Similar Agents in {agent.suburbs?.[0]?.suburb?.name ?? "Your Area"}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {similarAgents.map((sa) => {
              // Use current agent's primary suburb for location context
              const primarySuburb = agent.suburbs?.[0]?.suburb;
              return (
                <div key={sa.slug} className="min-w-[280px] snap-start shrink-0">
                  <AgentCard
                    agent={{
                      name: sa.fullName,
                      slug: sa.slug,
                      firstName: sa.firstName,
                      lastName: sa.lastName,
                      photoUrl: sa.photoUrl,
                      rating: sa.ratingsAverage ?? undefined,
                      ratingsCount: sa.ratingsCount ?? undefined,
                      totalSalesCount: sa.totalSalesCount ?? undefined,
                      totalSalesVolume: sa.totalSalesVolume ?? undefined,
                      suburbs: primarySuburb ? [{ name: primarySuburb.name, slug: primarySuburb.slug, state: primarySuburb.state }] : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
