import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { HeroVoiceButtonWrapper } from "@/components/voice/HeroVoiceButtonWrapper";
import { getSiteStats, getTopSuburbs, getTopAgencies } from "@/lib/db/queries";
import { formatNumber, formatCompactPrice } from "@/lib/utils/format";
import { homeJsonLd, safeJsonLd } from "@/lib/seo/jsonld";

const BASE_URL = "https://agentindex.com.au";

export const metadata: Metadata = {
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    images: [
      {
        url: `${BASE_URL}/api/og?type=home`,
        width: 1200,
        height: 630,
        alt: "AgentIndex — Find Real Estate Agents in Australia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const revalidate = 3600;

const FEATURED_STATES = ["NSW", "VIC", "QLD"] as const;

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search",
    description:
      "Search by suburb, agency, or agent name. Filter by property type, sales volume, and ratings to find the right match.",
  },
  {
    icon: TrendingUp,
    title: "Compare",
    description:
      "Review verified sales history, median prices, days on market, and client reviews side-by-side.",
  },
  {
    icon: Users,
    title: "Connect",
    description:
      "Reach out directly to top-performing agents who specialise in your area and property type.",
  },
] as const;

export default async function HomePage() {
  const [stats, topAgencies, ...suburbResults] = await Promise.all([
    getSiteStats(),
    getTopAgencies(8),
    ...FEATURED_STATES.map((state) => getTopSuburbs(state, 4)),
  ]);

  const allSuburbs = FEATURED_STATES.flatMap((state, i) =>
    suburbResults[i].map((suburb) => ({ ...suburb, _state: state }))
  );

  const hasSuburbs = allSuburbs.length > 0;
  const hasAgencies = topAgencies.length > 0;
  const hasStats =
    stats.totalAgents > 0 ||
    stats.totalSuburbs > 0 ||
    stats.totalAgencies > 0 ||
    stats.totalSales > 0;

  const homeData = homeJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(homeData) }}
      />
      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-dots py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tight">
            Find the <span className="text-voqo-green">Best</span> Real Estate
            Agents in Australia
          </h1>

          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Compare agents by sales history, reviews, and verified credentials
          </p>

          <div className="mt-8 max-w-2xl mx-auto">
            <SearchBar size="lg" />
          </div>

          {/* Voice Navigator Button */}
          <HeroVoiceButtonWrapper />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Popular Agencies Carousel                                         */}
      {/* ----------------------------------------------------------------- */}
      {hasAgencies && (
        <section className="py-12 border-b border-gray-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              Popular Agencies
            </h2>

            <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
              {topAgencies.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/agency/${agency.slug}`}
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                >
                  {agency.logoUrl ? (
                    <Image
                      src={agency.logoUrl}
                      alt={agency.name}
                      width={96}
                      height={48}
                      className="h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all"
                      unoptimized
                    />
                  ) : (
                    <div className="h-12 w-24 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <span className="text-xs text-gray-500 group-hover:text-voqo-green transition-colors">
                    {agency.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Featured Suburbs                                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="font-heading text-3xl font-black tracking-tight text-center mb-10">
          Explore Popular Suburbs
        </h2>

        {hasSuburbs ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allSuburbs.map((suburb) => {
              const stateSlug = suburb.state.toLowerCase();
              const medianPrice = suburb.medianHousePrice ?? suburb.medianPrice;

              return (
                <Link
                  key={suburb.id}
                  href={`/agents/${stateSlug}/${suburb.slug}`}
                >
                  <Card className="h-full">
                    <CardContent>
                      <h3 className="font-heading text-lg font-bold">
                        {suburb.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {suburb.state}
                        </span>
                        <span className="text-xs text-gray-500">
                          {suburb.postcode}
                        </span>
                      </div>
                      {medianPrice && medianPrice > 0 && (
                        <p className="mt-2 text-sm font-semibold text-voqo-green">
                          {formatCompactPrice(medianPrice)}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {suburb.totalAgents ?? 0} agent
                        {(suburb.totalAgents ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No suburbs listed yet</p>
            <p className="mt-1 text-sm">
              We&apos;re building our directory — check back soon.
            </p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How It Works                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-black tracking-tight text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-voqo-green/15 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-voqo-green" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Banner                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-12 bg-black px-4">
        <div className="max-w-5xl mx-auto">
          {hasStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <StatCard
                  icon={Users}
                  value={formatNumber(stats.totalAgents)}
                  label="Total Agents"
                />
                {/* Green vertical separator (visible on md+) */}
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-voqo-green" />
              </div>
              <div className="relative">
                <StatCard
                  icon={MapPin}
                  value={formatNumber(stats.totalSuburbs)}
                  label="Suburbs Covered"
                />
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-voqo-green" />
              </div>
              <div className="relative">
                <StatCard
                  icon={Building2}
                  value={formatNumber(stats.totalAgencies)}
                  label="Agencies"
                />
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-voqo-green" />
              </div>
              <StatCard
                icon={TrendingUp}
                value={formatNumber(stats.totalSales)}
                label="Properties Sold"
              />
            </div>
          ) : (
            <p className="text-center text-gray-400 text-lg font-medium py-4">
              Coming Soon &mdash; stats will appear as our directory grows.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
