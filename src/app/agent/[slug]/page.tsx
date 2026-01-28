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
} from "lucide-react";
import { AgentPhoto } from "@/components/agent/agent-photo";
import { AgentCard } from "@/components/agent/agent-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
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
import { breadcrumbJsonLd, agentJsonLd } from "@/lib/seo/jsonld";

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

  const stats = [
    agent.totalSalesCount ? `${agent.totalSalesCount}:sales` : "",
    agent.ratingsAverage ? `${agent.ratingsAverage.toFixed(1)}:rating` : "",
  ]
    .filter(Boolean)
    .join("|");

  const ogImageUrl = `${BASE_URL}/api/og?type=agent&name=${encodeURIComponent(agent.fullName)}&subtitle=${encodeURIComponent(agent.agency?.name || "")}&stats=${encodeURIComponent(stats)}`;

  return {
    title: `${agent.fullName} - Real Estate Agent in ${suburbName} | AgentIndex`,
    description: `View ${agent.fullName}'s sales history, reviews, and performance stats. ${agent.totalSalesCount ?? 0} properties sold.`,
    alternates: {
      canonical: `${BASE_URL}/agent/${slug}`,
    },
    openGraph: {
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
  const allSales = agent.sales ?? [];
  const totalSalesPages = Math.max(1, Math.ceil(allSales.length / salesPerPage));
  const paginatedSales = allSales.slice(
    (salesPage - 1) * salesPerPage,
    salesPage * salesPerPage
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

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agents", url: `${BASE_URL}/agents` },
    { name: agent.fullName, url: `${BASE_URL}/agent/${slug}` },
  ]);

  const agentData = agentJsonLd({
    fullName: agent.fullName,
    photoUrl: agent.photoUrl,
    phone: agent.phone,
    email: agent.email,
    agency: agent.agency,
    ratingsAverage: agent.ratingsAverage,
    ratingsCount: agent.ratingsCount ?? undefined,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentData) }}
      />
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
            <p className="text-gray-600 mb-2">
              <Link
                href={`/agency/${agent.agency.slug}`}
                className="hover:text-voqo-green transition-colors"
              >
                {agent.agency.name}
              </Link>
            </p>
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
            <Button variant="primary" size="sm">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Talk to Assistant
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
            label="Total Sales"
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
      {/* Sales History                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">Sales History</h2>

        {allSales.length === 0 ? (
          <p className="text-gray-500">No sales recorded.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days on Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.propertyAddress}
                    </TableCell>
                    <TableCell>
                      {sale.salePrice ? formatCurrency(sale.salePrice) : "-"}
                    </TableCell>
                    <TableCell>
                      {sale.saleDate ? formatDate(sale.saleDate) : "-"}
                    </TableCell>
                    <TableCell>{sale.propertyType ?? "-"}</TableCell>
                    <TableCell>
                      {sale.daysOnMarket != null ? sale.daysOnMarket : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalSalesPages > 1 && (
              <Pagination
                currentPage={salesPage}
                totalPages={totalSalesPages}
                basePath={`/agent/${slug}`}
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

        {(agent.reviews ?? []).length === 0 ? (
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
                ({agent.ratingsCount ?? agent.reviews.length} review
                {(agent.ratingsCount ?? agent.reviews.length) !== 1
                  ? "s"
                  : ""})
              </span>
            </div>

            <div className="space-y-4">
              {agent.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border-2 border-black rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">
                      {review.reviewerName ?? "Anonymous"}
                    </span>
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
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Similar Agents                                                      */}
      {/* ------------------------------------------------------------------ */}
      {similarAgents.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold mb-4">
            Similar Agents
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {similarAgents.map((sa) => (
              <div key={sa.slug} className="min-w-[280px] snap-start shrink-0">
                <AgentCard
                  agent={{
                    name: sa.fullName,
                    slug: sa.slug,
                    firstName: sa.firstName,
                    lastName: sa.lastName,
                    photoUrl: sa.photoUrl,
                    rating: sa.ratingsAverage ?? undefined,
                    totalSalesCount: sa.totalSalesCount ?? undefined,
                    totalSalesVolume: sa.totalSalesVolume ?? undefined,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
