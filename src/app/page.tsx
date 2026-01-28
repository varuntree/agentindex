import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  Mic,
  ArrowRight,
} from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { getSiteStats, getTopSuburbs } from "@/lib/db/queries";
import { formatNumber } from "@/lib/utils/format";
import { homeJsonLd } from "@/lib/seo/jsonld";

const BASE_URL = "https://agentindex.com.au";

export const metadata: Metadata = {
  alternates: {
    canonical: BASE_URL,
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
  const [stats, ...suburbResults] = await Promise.all([
    getSiteStats(),
    ...FEATURED_STATES.map((state) => getTopSuburbs(state, 4)),
  ]);

  const allSuburbs = FEATURED_STATES.flatMap((state, i) =>
    suburbResults[i].map((suburb) => ({ ...suburb, _state: state }))
  );

  const hasSuburbs = allSuburbs.length > 0;
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeData) }}
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

          <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-1.5">
            <Mic className="w-4 h-4" />
            Or ask our voice assistant
          </p>
        </div>
      </section>

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
              // Suburb slug is "name-state", strip trailing state for the URL segment
              const nameParts = suburb.slug.split("-");
              nameParts.pop(); // remove state suffix
              const nameSlug = nameParts.join("-");

              return (
                <Link
                  key={suburb.id}
                  href={`/agents/${stateSlug}/${nameSlug}`}
                >
                  <Card className="h-full">
                    <CardContent>
                      <h3 className="font-heading text-lg font-bold">
                        {suburb.name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {suburb.state}
                      </span>
                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
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
              <StatCard
                icon={Users}
                value={formatNumber(stats.totalAgents)}
                label="Total Agents"
              />
              <StatCard
                icon={MapPin}
                value={formatNumber(stats.totalSuburbs)}
                label="Suburbs Covered"
              />
              <StatCard
                icon={Building2}
                value={formatNumber(stats.totalAgencies)}
                label="Agencies"
              />
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
