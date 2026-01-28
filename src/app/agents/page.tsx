import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getStateStats } from "@/lib/db/queries";
import { formatNumber } from "@/lib/utils/format";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

const BASE_URL = "https://agentindex.com.au";

export const metadata: Metadata = {
  title: "Real Estate Agents by State",
  alternates: {
    canonical: `${BASE_URL}/agents`,
  },
  openGraph: {
    images: [
      {
        url: `${BASE_URL}/api/og?type=suburb&name=Australia&subtitle=Browse agents by state`,
        width: 1200,
        height: 630,
        alt: "Real Estate Agents by State",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

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

export default async function AgentsPage() {
  const stateEntries = await Promise.all(
    Object.entries(STATES).map(async ([abbrev, fullName]) => {
      const stats = await getStateStats(abbrev);
      return { abbrev, fullName, stats };
    })
  );

  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: BASE_URL },
    { name: "Agents", url: `${BASE_URL}/agents` },
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Breadcrumb items={[{ label: "Agents" }]} className="mb-6" />

      <h1 className="font-heading text-3xl md:text-4xl font-black mb-8">
        Real Estate Agents by State
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stateEntries.map(({ abbrev, fullName, stats }) => (
          <Link key={abbrev} href={`/agents/${abbrev}`} className="block">
            <Card className="h-full">
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <MapPin className="w-5 h-5 text-voqo-green shrink-0" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 uppercase">
                    {abbrev}
                  </span>
                </div>
                <h2 className="font-heading font-bold text-lg leading-tight">
                  {fullName}
                </h2>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {stats.agents > 0 || stats.suburbs > 0
                    ? `${formatNumber(stats.agents)} agents across ${formatNumber(stats.suburbs)} suburbs`
                    : "No agents listed yet"}
                </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
