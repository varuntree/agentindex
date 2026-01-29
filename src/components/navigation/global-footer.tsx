import Link from 'next/link';
import { getTopSuburbs } from '@/lib/db/queries';

interface StateConfig {
  name: string;
  slug: string;
}

const stateConfigs: StateConfig[] = [
  { name: 'NSW', slug: 'nsw' },
  { name: 'VIC', slug: 'vic' },
  { name: 'QLD', slug: 'qld' },
  { name: 'WA', slug: 'wa' },
  { name: 'SA', slug: 'sa' },
  { name: 'TAS', slug: 'tas' },
  { name: 'NT', slug: 'nt' },
  { name: 'ACT', slug: 'act' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact', href: 'mailto:hello@agentindex.com.au' },
];

export async function GlobalFooter() {
  // Fetch top 5 suburbs per state from database
  const statesWithSuburbs = await Promise.all(
    stateConfigs.map(async (state) => {
      const suburbs = await getTopSuburbs(state.slug.toUpperCase(), 5);
      return {
        ...state,
        suburbs: suburbs.map((s) => ({ name: s.name, slug: s.slug })),
      };
    })
  );

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* State / suburb links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statesWithSuburbs.map((state) => (
            <div key={state.slug}>
              <h3 className="font-heading font-bold text-lg mb-3">
                {state.name}
              </h3>
              <ul className="space-y-1.5">
                {state.suburbs.map((suburb) => (
                  <li key={suburb.slug}>
                    <Link
                      href={`/agents/${state.slug}/${suburb.slug}`}
                      className="text-sm text-gray-400 hover:text-voqo-green transition-colors"
                    >
                      {suburb.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* About section */}
        <div className="mt-10 mb-6 text-center max-w-2xl mx-auto">
          <h3 className="font-heading font-bold text-lg mb-2">
            Australia&apos;s Agent Directory
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            AgentIndex helps Australians find the right real estate agent using verified sales data,
            client reviews, and AI-powered voice assistants. Compare agents transparently
            and make informed property decisions.
          </p>
        </div>

        {/* Powered by */}
        <div className="mb-8 text-center">
          <span className="font-accent text-voqo-lime">
            Powered by Voqo AI
          </span>
        </div>

        {/* Bottom: copyright + legal */}
        <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2025 AgentIndex</span>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
