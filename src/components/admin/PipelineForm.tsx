'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PipelineFormProps {
  onStart: (data: {
    location: string;
    agencies: { agencyName: string; limit: number }[];
  }) => void;
  disabled?: boolean;
}

export function PipelineForm({ onStart, disabled }: PipelineFormProps) {
  const [location, setLocation] = useState('');

  const [agencies, setAgencies] = useState<{ agencyName: string; limit: number }[]>([
    { agencyName: '', limit: 50 },
  ]);

  const canSubmit =
    location.trim().length > 0 &&
    agencies.some((a) => a.agencyName.trim().length > 0) &&
    !disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = agencies
      .map((a) => ({
        agencyName: a.agencyName.trim(),
        limit: Math.min(200, Math.max(1, a.limit || 50)),
      }))
      .filter((a) => a.agencyName.length > 0);

    if (cleaned.length > 0) {
      onStart({ location: location.trim(), agencies: cleaned });
    }
  };

  const filteredAgencies = useMemo(() => {
    return agencies.map((a) => ({
      agencyName: a.agencyName,
      limit: Math.min(200, Math.max(1, a.limit || 1)),
    }));
  }, [agencies]);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border-2 border-black">
      <h2 className="text-lg font-semibold mb-4">Pipeline Run</h2>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location</label>
        <Input
          type="text"
          placeholder='e.g., "Bondi Beach, NSW"'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={disabled}
        />
        <div className="mt-2 text-xs text-gray-600">
          The orchestrator will interpret this (suburb/state/postcode) and match it to seeded suburbs.
        </div>
      </div>

      {/* Agencies */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Agencies</label>
        <div className="space-y-2">
          {filteredAgencies.map((agency, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8">
                <Input
                  type="text"
                  placeholder='Agency name (e.g., "Ray White Bondi Beach")'
                  value={agency.agencyName}
                  onChange={(e) => {
                    const next = [...agencies];
                    next[idx] = { ...next[idx], agencyName: e.target.value };
                    setAgencies(next);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={agency.limit}
                  onChange={(e) => {
                    const next = [...agencies];
                    next[idx] = {
                      ...next[idx],
                      limit: Math.min(200, Math.max(1, Number(e.target.value) || 1)),
                    };
                    setAgencies(next);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-2"
                  onClick={() => setAgencies((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={disabled || agencies.length <= 1}
                  title="Remove agency"
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAgencies((prev) => [...prev, { agencyName: '', limit: 50 }])}
            disabled={disabled}
          >
            Add agency
          </Button>
          <div className="text-xs text-gray-500">Limit per agency (max 200)</div>
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {disabled ? 'Running...' : 'Start Pipeline'}
      </Button>
    </form>
  );
}
