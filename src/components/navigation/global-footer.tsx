import Link from 'next/link';

interface SuburbLink {
  name: string;
  slug: string;
}

interface StateData {
  name: string;
  slug: string;
  suburbs: SuburbLink[];
}

const states: StateData[] = [
  {
    name: 'NSW',
    slug: 'nsw',
    suburbs: [
      { name: 'Bondi Beach', slug: 'bondi-beach' },
      { name: 'Surry Hills', slug: 'surry-hills' },
      { name: 'Manly', slug: 'manly' },
      { name: 'Parramatta', slug: 'parramatta' },
      { name: 'Newtown', slug: 'newtown' },
    ],
  },
  {
    name: 'VIC',
    slug: 'vic',
    suburbs: [
      { name: 'South Yarra', slug: 'south-yarra' },
      { name: 'Richmond', slug: 'richmond' },
      { name: 'St Kilda', slug: 'st-kilda' },
      { name: 'Brighton', slug: 'brighton' },
      { name: 'Fitzroy', slug: 'fitzroy' },
    ],
  },
  {
    name: 'QLD',
    slug: 'qld',
    suburbs: [
      { name: 'Surfers Paradise', slug: 'surfers-paradise' },
      { name: 'Noosa Heads', slug: 'noosa-heads' },
      { name: 'Paddington', slug: 'paddington' },
      { name: 'New Farm', slug: 'new-farm' },
      { name: 'Broadbeach', slug: 'broadbeach' },
    ],
  },
  {
    name: 'WA',
    slug: 'wa',
    suburbs: [
      { name: 'Fremantle', slug: 'fremantle' },
      { name: 'Subiaco', slug: 'subiaco' },
      { name: 'Cottesloe', slug: 'cottesloe' },
      { name: 'Scarborough', slug: 'scarborough' },
      { name: 'Joondalup', slug: 'joondalup' },
    ],
  },
  {
    name: 'SA',
    slug: 'sa',
    suburbs: [
      { name: 'Glenelg', slug: 'glenelg' },
      { name: 'North Adelaide', slug: 'north-adelaide' },
      { name: 'Norwood', slug: 'norwood' },
      { name: 'Unley', slug: 'unley' },
      { name: 'Prospect', slug: 'prospect' },
    ],
  },
  {
    name: 'TAS',
    slug: 'tas',
    suburbs: [
      { name: 'Battery Point', slug: 'battery-point' },
      { name: 'Sandy Bay', slug: 'sandy-bay' },
      { name: 'Launceston', slug: 'launceston' },
      { name: 'Kingston', slug: 'kingston' },
      { name: 'Devonport', slug: 'devonport' },
    ],
  },
  {
    name: 'NT',
    slug: 'nt',
    suburbs: [
      { name: 'Darwin City', slug: 'darwin-city' },
      { name: 'Stuart Park', slug: 'stuart-park' },
      { name: 'Parap', slug: 'parap' },
      { name: 'Nightcliff', slug: 'nightcliff' },
      { name: 'Alice Springs', slug: 'alice-springs' },
    ],
  },
  {
    name: 'ACT',
    slug: 'act',
    suburbs: [
      { name: 'Braddon', slug: 'braddon' },
      { name: 'Kingston', slug: 'kingston' },
      { name: 'Manuka', slug: 'manuka' },
      { name: 'Woden', slug: 'woden' },
      { name: 'Belconnen', slug: 'belconnen' },
    ],
  },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact', href: 'mailto:hello@agentindex.com.au' },
];

export function GlobalFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* State / suburb links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {states.map((state) => (
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
