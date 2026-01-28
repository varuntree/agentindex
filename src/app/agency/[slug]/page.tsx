import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, Globe, Users, BarChart3, DollarSign } from "lucide-react";
import { AgentCard } from "@/components/agent/agent-card";
import { StatCard } from "@/components/ui/stat-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getAgencyBySlug } from "@/lib/db/queries";
import {
  formatCurrency,
  formatCompactPrice,
  formatNumber,
  formatDate,
} from "@/lib/utils/format";
import { breadcrumbJsonLd, agencyJsonLd } from "@/lib/seo/jsonld";

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

  const stats = [
    agency.totalAgents ? `${agency.totalAgents}:agents` : "",
    agency.totalSalesCount ? `${formatNumber(agency.totalSalesCount)}:sales` : "",
  ]
    .filter(Boolean)
    .join("|");

  const ogImageUrl = `${BASE_URL}/api/og?type=agency&name=${encodeURIComponent(agency.name)}&subtitle=${encodeURIComponent(agency.suburb || "")}&stats=${encodeURIComponent(stats)}`;

  return {
    title: `${agency.name} - Real Estate Agency | AgentIndex`,
    description: `${agency.name} has ${agency.totalAgents ?? 0} agents and ${formatNumber(agency.totalSalesCount ?? 0)} total sales.`,
    alternates: {
      canonical: `${BASE_URL}/agency/${slug}`,
    },
    openGraph: {
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: agency.name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AgencyProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);

  if (!agency) {
    notFound();
  }

  const agentsList = agency.agents ?? [];

  // Gather recent sales from all agents (flatten, sort by date, take 20)
  const recentSales = agentsList
    .flatMap((agent) =>
      (agent.totalSalesCount ?? 0) > 0
        ? [
            {
              agentName: agent.fullName,
              agentSlug: agent.slug,
            },
          ]
        : []
    );

  // Build address for display
  const addressParts = [
    agency.streetAddress,
    agency.suburb,
    agency.state?.toUpperCase(),
    agency.postcode,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agencies", url: `${BASE_URL}/agencies` },
    { name: agency.name, url: `${BASE_URL}/agency/${slug}` },
  ]);

  const agencyData = agencyJsonLd({
    name: agency.name,
    phone: agency.phone,
    email: agency.email,
    websiteUrl: agency.websiteUrl,
    streetAddress: agency.streetAddress,
    suburb: agency.suburb,
    state: agency.state,
    postcode: agency.postcode,
    totalAgents: agency.totalAgents ?? 0,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agencyData) }}
      />
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
        <h1 className="font-heading text-3xl md:text-4xl font-black mb-4">
          {agency.name}
        </h1>

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
        </div>

        {fullAddress && (
          <p className="text-sm text-gray-500 mb-6">{fullAddress}</p>
        )}

        <div className="grid grid-cols-3 gap-4 max-w-lg">
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
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Agent Roster                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">Agent Roster</h2>

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
                  totalSalesCount: agent.totalSalesCount ?? undefined,
                  totalSalesVolume: agent.totalSalesVolume ?? undefined,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recent Sales                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold mb-4">Recent Sales</h2>

        {(agency.totalSalesCount ?? 0) === 0 ? (
          <p className="text-gray-500">No sales recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Sales Volume</TableHead>
                <TableHead>Median Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentsList
                .filter((a) => (a.totalSalesCount ?? 0) > 0)
                .slice(0, 20)
                .map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/agent/${agent.slug}`}
                        className="hover:text-voqo-green transition-colors"
                      >
                        {agent.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatNumber(agent.totalSalesCount ?? 0)}
                    </TableCell>
                    <TableCell>
                      {agent.totalSalesVolume
                        ? formatCompactPrice(agent.totalSalesVolume)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {agent.medianSalePrice
                        ? formatCurrency(agent.medianSalePrice)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  );
}
