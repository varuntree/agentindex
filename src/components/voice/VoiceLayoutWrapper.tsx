'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { PageType } from '@/lib/voice/types';
import type { ReactNode } from 'react';

const VoiceProvider = dynamic(
  () => import('./VoiceProvider').then((mod) => mod.VoiceProvider),
  { ssr: false }
);

interface VoiceLayoutWrapperProps {
  children: ReactNode;
}

/**
 * Client wrapper for VoiceProvider that detects the current page type from the URL.
 * Used in layout.tsx to provide voice functionality across all pages.
 *
 * Page detection:
 * - /agent/[slug] → pageType: 'agent'
 * - /agency/[slug] → pageType: 'agency'
 * - /agents/[state]/[suburb-slug] → pageType: 'suburb'
 * - Everything else → pageType: 'home'
 */
export function VoiceLayoutWrapper({ children }: VoiceLayoutWrapperProps) {
  const pathname = usePathname();

  // Detect page type and slug from pathname
  const { pageType, agentSlug, agencySlug, suburbSlug } = detectPageContext(pathname);

  return (
    <VoiceProvider
      pageType={pageType}
      agentSlug={agentSlug}
      agencySlug={agencySlug}
      suburbSlug={suburbSlug}
      defaultMode="navigator"
    >
      {children}
    </VoiceProvider>
  );
}

function detectPageContext(pathname: string): {
  pageType: PageType;
  agentSlug?: string;
  agencySlug?: string;
  suburbSlug?: string;
} {
  // /agent/[slug]
  const agentMatch = pathname.match(/^\/agent\/([^/]+)$/);
  if (agentMatch) {
    return { pageType: 'agent', agentSlug: agentMatch[1] };
  }

  // /agency/[slug]
  const agencyMatch = pathname.match(/^\/agency\/([^/]+)$/);
  if (agencyMatch) {
    return { pageType: 'agency', agencySlug: agencyMatch[1] };
  }

  // /agents/[state]/[suburb-slug] → suburb page
  const suburbMatch = pathname.match(/^\/agents\/([^/]+)\/([^/]+)$/);
  if (suburbMatch) {
    return { pageType: 'suburb', suburbSlug: suburbMatch[2] };
  }

  // Default: home/navigator mode
  return { pageType: 'home' };
}
