'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Mic } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import { useVoice } from '@/components/voice/VoiceProvider';

const navLinks = [
  { label: 'Agents', href: '/agents' },
  { label: 'Agencies', href: '/agencies' },
];

export function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // useVoice is safe because GlobalNav is always rendered inside VoiceLayoutWrapper
  // which provides VoiceProvider (with ssr: false, so this only runs client-side)
  const voiceContext = useVoice();
  const { startSession, status } = voiceContext;

  const handleVoiceClick = () => {
    if (status === 'idle') {
      startSession('navigator');
    }
  };

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

          {/* Right: desktop nav links + voice button */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-voqo-green transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Voice Navigator Button */}
            <button
              onClick={handleVoiceClick}
              disabled={status !== 'idle'}
              className="flex items-center gap-2 bg-voqo-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-voqo-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ask Navigator"
            >
              <Mic className="w-4 h-4" />
              <span>Ask Navigator</span>
            </button>
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

            {/* Voice Navigator Button - mobile */}
            <button
              onClick={() => {
                setMobileOpen(false);
                handleVoiceClick();
              }}
              disabled={status !== 'idle'}
              className="w-full flex items-center justify-center gap-2 bg-voqo-green text-white px-4 py-3 rounded-md font-medium hover:bg-voqo-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ask Navigator"
            >
              <Mic className="w-5 h-5" />
              <span>Ask Navigator</span>
            </button>

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
