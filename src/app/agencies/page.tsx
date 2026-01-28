import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/pagination";
import { getAgenciesList } from "@/lib/db/queries";
import { formatNumber, formatCompactPrice } from "@/lib/utils/format";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

const BASE_URL = "https://agentindex.com.au";

export const revalidate = 21600;

export function generateMetadata(): Metadata {
  return {
    title: "Real Estate Agencies in Australia | AgentIndex",
    description:
      "Browse real estate agencies across Australia. Find agencies by state, view agent rosters and sales history.",
    alternates: {
      // Canonical always points to base page (no pagination/filter params)
      canonical: `${BASE_URL}/agencies`,
    },
    openGraph: {
      images: [
        {
          url: `${BASE_URL}/api/og?type=agency&name=Real Estate Agencies&subtitle=Browse agencies across Australia`,
          width: 1200,
          height: 630,
          alt: "Real Estate Agencies in Australia",
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

const STATES = [
  { value: "", label: "All" },
  { value: "nsw", label: "NSW" },
  { value: "vic", label: "VIC" },
  { value: "qld", label: "QLD" },
  { value: "wa", label: "WA" },
  { value: "sa", label: "SA" },
  { value: "tas", label: "TAS" },
  { value: "nt", label: "NT" },
  { value: "act", label: "ACT" },
];

const PAGE_SIZE = 24;

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AgenciesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const stateFilter = typeof sp.state === "string" ? sp.state : "";
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const { agencies, total } = await getAgenciesList({
    state: stateFilter || undefined,
    sort: "name",
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Build basePath preserving state filter
  const basePath = stateFilter ? `/agencies?state=${stateFilter}` : "/agencies";

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agencies", url: `${BASE_URL}/agencies` },
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Breadcrumb items={[{ label: "Agencies" }]} className="mb-6" />

      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-6">
        <h1 className="font-heading text-3xl md:text-4xl font-black">
          Real Estate Agencies in Australia
        </h1>
        <span className="text-gray-500 text-sm">
          {formatNumber(total)} agenc{total === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* State filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4 scrollbar-hide">
        {STATES.map((s) => {
          const isActive = stateFilter === s.value;
          const href = s.value
            ? `/agencies?state=${s.value}`
            : "/agencies";

          return (
            <Link
              key={s.value}
              href={href}
              className={`shrink-0 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                isActive
                  ? "bg-voqo-green text-white border-black"
                  : "bg-white text-gray-700 border-gray-300 hover:border-black"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {/* Agency grid */}
      {agencies.length === 0 ? (
        <p className="text-gray-500">No agencies found.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agencies.map((agency) => (
              <Link
                key={agency.slug}
                href={`/agency/${agency.slug}`}
                className="block"
              >
                <Card className="h-full">
                  <CardContent>
                    <div className="flex items-start gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-voqo-green shrink-0 mt-0.5" />
                      <h2 className="font-heading font-bold text-sm leading-tight line-clamp-2">
                        {agency.name}
                      </h2>
                    </div>
                    {agency.suburb && (
                      <p className="text-xs text-gray-500 mb-2">
                        {agency.suburb}
                        {agency.state ? `, ${agency.state.toUpperCase()}` : ""}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formatNumber(agency.totalAgents ?? 0)} agents
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        {formatNumber(agency.totalSalesCount ?? 0)} sales
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={basePath}
              className="mt-8 justify-center"
            />
          )}
        </>
      )}
    </main>
  );
}
