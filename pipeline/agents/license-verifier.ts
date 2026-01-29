/**
 * License Verification Agent
 * Verifies real estate agent licenses via NSW Fair Trading register
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const LicenseOutputSchema = z.object({
  license_number: z.string().optional(),
  license_status: z
    .enum(['active', 'suspended', 'cancelled', 'unknown'])
    .optional(),
  license_issue_date: z.string().optional(),
  license_expiry_date: z.string().optional(),
});

export type LicenseOutput = z.infer<typeof LicenseOutputSchema>;

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Build prompt for license verification
 */
export function buildLicenseVerificationPrompt(
  agentName: string,
  agencyName?: string
): string {
  return `You are a license verification specialist. Your task is to verify the real estate license for:

Agent: ${agentName}
${agencyName ? `Agency: ${agencyName}` : ''}

## Instructions

1. Search the NSW Fair Trading certificate holders register at service.nsw.gov.au
2. Look for real estate agent/salesperson licenses matching this name
3. If found, extract:
   - License number
   - License status (active, suspended, cancelled)
   - Issue date
   - Expiry date

## Important Notes

- Only use publicly available government registers
- If no exact match found, return status as "unknown"
- License numbers typically follow format like "12345678" or with prefixes
- Focus on NSW Fair Trading (service.nsw.gov.au) as primary source

## Output Format

Return a JSON object with:
- license_number: The license identifier (or null if not found)
- license_status: "active" | "suspended" | "cancelled" | "unknown"
- license_issue_date: ISO date string (or null)
- license_expiry_date: ISO date string (or null)

If you cannot find license information, return:
{
  "license_number": null,
  "license_status": "unknown",
  "license_issue_date": null,
  "license_expiry_date": null
}`;
}

// ---------------------------------------------------------------------------
// Response Parser
// ---------------------------------------------------------------------------

/**
 * Parse license verification response
 */
export function parseLicenseResponse(response: string): LicenseOutput {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Handle null values - convert to undefined for schema compatibility
      const normalized = {
        license_number: parsed.license_number ?? undefined,
        license_status: parsed.license_status ?? undefined,
        license_issue_date: parsed.license_issue_date ?? undefined,
        license_expiry_date: parsed.license_expiry_date ?? undefined,
      };
      return LicenseOutputSchema.parse(normalized);
    }
  } catch {
    // Fall through to default
  }

  return {
    license_status: 'unknown',
  };
}
