'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';

const navLinks = [
  { label: 'Agents', href: '/agents' },
  { label: 'Agencies', href: '/agencies' },
];

export function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-heading font-black text-xl shrink-0">
            <span className="text-black">Agent</span>
            <span className="text-voqo-green">Index</span>
          </Link>

          {/* Center: SearchBar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center mx-8">
            <SearchBar size="sm" />
          </div>

          {/* Right: desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-voqo-green transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
          {/* Drawer header */}
          <div className="h-14 flex items-center justify-between px-4 border-b-2 border-black">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="font-heading font-black text-xl"
            >
              <span className="text-black">Agent</span>
              <span className="text-voqo-green">Index</span>
            </Link>
            <button
              className="p-2 -mr-2 cursor-pointer"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* SearchBar at top */}
            <SearchBar size="sm" />

            {/* Nav links stacked */}
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-medium hover:text-voqo-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
