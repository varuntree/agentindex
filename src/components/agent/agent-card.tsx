import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { SuburbBadge } from "@/components/ui/suburb-badge";
import { AgentPhoto } from "@/components/agent/agent-photo";
import { formatNumber, formatCompactPrice } from "@/lib/utils/format";

interface AgentSuburb {
  name: string;
  slug: string;
  state: string;
}

interface Agent {
  name: string;
  slug: string;
  firstName: string;
  lastName: string;
  agencyName?: string;
  agencySlug?: string;
  photoUrl?: string | null;
  rating?: number;
  totalSalesCount?: number;
  totalSalesVolume?: number;
  suburbs?: AgentSuburb[];
}

interface AgentCardProps {
  agent: Agent;
  className?: string;
}

function AgentCard({ agent, className = "" }: AgentCardProps) {
  const {
    name,
    slug,
    firstName,
    lastName,
    agencyName,
    agencySlug,
    photoUrl,
    rating,
    totalSalesCount,
    totalSalesVolume,
    suburbs = [],
  } = agent;

  const visibleSuburbs = suburbs.slice(0, 3);
  const extraCount = suburbs.length - 3;

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-start gap-4">
          <AgentPhoto
            photoUrl={photoUrl}
            firstName={firstName}
            lastName={lastName}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg truncate">
              <Link
                href={`/agent/${slug}`}
                className="hover:text-voqo-green transition-colors"
              >
                {name}
              </Link>
            </h3>
            {agencyName && (
              <p className="text-sm text-gray-500 truncate">
                {agencySlug ? (
                  <Link
                    href={`/agency/${agencySlug}`}
                    className="hover:text-voqo-green transition-colors"
                  >
                    {agencyName}
                  </Link>
                ) : (
                  agencyName
                )}
              </p>
            )}
            {rating !== undefined && rating > 0 && (
              <StarRating rating={rating} size="sm" showValue className="mt-1" />
            )}
          </div>
        </div>

        {(totalSalesCount !== undefined || totalSalesVolume !== undefined) && (
          <div className="flex gap-6 mt-4 text-sm">
            {totalSalesCount !== undefined && (
              <div>
                <span className="font-bold text-black">
                  {formatNumber(totalSalesCount)}
                </span>{" "}
                <span className="text-gray-500">sales</span>
              </div>
            )}
            {totalSalesVolume !== undefined && totalSalesVolume > 0 && (
              <div>
                <span className="font-bold text-black">
                  {formatCompactPrice(totalSalesVolume)}
                </span>{" "}
                <span className="text-gray-500">volume</span>
              </div>
            )}
          </div>
        )}

        {visibleSuburbs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {visibleSuburbs.map((suburb, idx) => (
              <SuburbBadge
                key={suburb.slug}
                name={suburb.name}
                slug={suburb.slug}
                state={suburb.state}
                isPrimary={idx === 0}
              />
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500">
                +{extraCount} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex gap-2 w-full">
          <Link href={`/agent/${slug}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
          <Button variant="secondary" size="sm" className="flex-1">
            Talk to Agent
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export { AgentCard, type AgentCardProps, type Agent };
