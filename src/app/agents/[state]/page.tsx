import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Home, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SearchBar } from "@/components/search/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { getStateStats, getSuburbsList } from "@/lib/db/queries";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { stateMetadata } from "@/lib/seo/metadata";

const BASE_URL = "https://agentindex.com.au";

export const revalidate = 43200;

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
  return VALID_STATES.map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const fullName = STATES[state];
  if (!fullName) return { title: "Not Found" };

  // Use stateMetadata helper for consistent title/description with year
  const baseMeta = stateMetadata({
    name: fullName,
    abbrev: state.toUpperCase(),
  });

  const ogImageUrl = `${BASE_URL}/api/og?type=suburb&name=${encodeURIComponent(fullName)}&subtitle=Browse real estate agents`;

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Real Estate Agents in ${fullName}` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function StatePage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { state } = await params;
  const { page: pageParam } = await searchParams;

  if (!VALID_STATES.includes(state)) {
    notFound();
  }

  const fullName = STATES[state];
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 48;

  const [stats, { suburbs, total }] = await Promise.all([
    getStateStats(state),
    getSuburbsList({ state, sort: "agents", page: currentPage, limit }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agents", url: `${BASE_URL}/agents` },
    { name: fullName, url: `${BASE_URL}/agents/${state}` },
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Breadcrumb
        items={[
          { label: "Agents", href: "/agents" },
          { label: fullName },
        ]}
        className="mb-6"
      />

      <h1 className="font-heading text-3xl md:text-4xl font-black mb-2">
        Real Estate Agents in {fullName}
      </h1>

      <p className="text-gray-500 mb-6 flex items-center gap-2">
        <Users className="w-4 h-4" />
        {stats.agents > 0 || stats.suburbs > 0
          ? `${formatNumber(stats.agents)} agents across ${formatNumber(stats.suburbs)} suburbs`
          : "No agents listed yet"}
      </p>

      <SearchBar
        placeholder={`Search agents in ${fullName}...`}
        className="max-w-xl mb-8"
      />

      {suburbs.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">
          No suburbs found for {fullName} yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suburbs.map((suburb) => (
              <Link
                key={suburb.slug}
                href={`/agents/${state}/${suburb.slug}`}
                className="block"
              >
                <Card className="h-full">
                  <CardContent>
                    <h3 className="font-heading font-bold text-base truncate">
                      {suburb.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        <Users className="w-3 h-3" />
                        {formatNumber(suburb.totalAgents ?? 0)}
                      </span>
                    </div>

                    {suburb.medianHousePrice != null &&
                      suburb.medianHousePrice > 0 && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          Median {formatCurrency(suburb.medianHousePrice)}
                        </p>
                      )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/agents/${state}`}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
