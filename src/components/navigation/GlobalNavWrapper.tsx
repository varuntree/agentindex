'use client';

import dynamic from 'next/dynamic';

const GlobalNav = dynamic(
  () => import('./global-nav').then((mod) => mod.GlobalNav),
  { ssr: false }
);

export function GlobalNavWrapper() {
  return <GlobalNav />;
}
