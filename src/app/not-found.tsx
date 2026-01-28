import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import { Users, Building2 } from "lucide-react";

export default function NotFound() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-heading text-5xl font-black tracking-tight">
          Page Not Found
        </h1>

        <p className="mt-4 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching instead.
        </p>

        <div className="mt-8 max-w-md mx-auto">
          <SearchBar size="lg" />
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/agents">
            <Button variant="secondary" size="md">
              <Users className="w-4 h-4 mr-2" />
              Browse Agents
            </Button>
          </Link>
          <Link href="/agencies">
            <Button variant="secondary" size="md">
              <Building2 className="w-4 h-4 mr-2" />
              Browse Agencies
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
