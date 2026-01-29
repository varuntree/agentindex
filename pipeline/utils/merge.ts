/**
 * Data Merge Utilities
 *
 * Implements conflict resolution for pipeline upserts:
 * - Prefer non-null values
 * - Prefer longer text for descriptions/bios
 * - Merge unique values in arrays
 * - Always use newer timestamps
 */

/**
 * Merge two values, preferring non-null
 * For strings, prefers longer non-empty value
 */
export function mergeValue<T>(existing: T | null | undefined, incoming: T | null | undefined): T | null {
  // If incoming is null/undefined, keep existing
  if (incoming === null || incoming === undefined) {
    return existing ?? null;
  }

  // If existing is null/undefined, use incoming
  if (existing === null || existing === undefined) {
    return incoming;
  }

  // Both have values - prefer incoming (newer data)
  return incoming;
}

/**
 * Merge two string values, preferring longer non-empty content
 * Useful for bio, description fields
 */
export function mergeText(
  existing: string | null | undefined,
  incoming: string | null | undefined
): string | null {
  const existingText = existing?.trim() || null;
  const incomingText = incoming?.trim() || null;

  // If one is null, return the other
  if (!existingText) return incomingText;
  if (!incomingText) return existingText;

  // Return the longer one (more complete data)
  return incomingText.length >= existingText.length ? incomingText : existingText;
}

/**
 * Merge two arrays, keeping unique values
 */
export function mergeArrays<T>(
  existing: T[] | null | undefined,
  incoming: T[] | null | undefined,
  keyFn?: (item: T) => string
): T[] {
  const existingArr = existing || [];
  const incomingArr = incoming || [];

  if (keyFn) {
    // Use key function for deduplication
    const seen = new Map<string, T>();
    for (const item of existingArr) {
      seen.set(keyFn(item), item);
    }
    for (const item of incomingArr) {
      seen.set(keyFn(item), item); // incoming overwrites
    }
    return Array.from(seen.values());
  }

  // Simple deduplication using Set (for primitives)
  return Array.from(new Set([...existingArr, ...incomingArr]));
}

/**
 * Merge two numeric values, preferring non-zero incoming
 */
export function mergeNumber(
  existing: number | null | undefined,
  incoming: number | null | undefined
): number | null {
  if (incoming !== null && incoming !== undefined && incoming !== 0) {
    return incoming;
  }
  return existing ?? null;
}

/**
 * Merge two date values, preferring more recent
 */
export function mergeDate(
  existing: Date | string | null | undefined,
  incoming: Date | string | null | undefined
): Date | null {
  const existingDate = existing ? new Date(existing) : null;
  const incomingDate = incoming ? new Date(incoming) : null;

  if (!existingDate || isNaN(existingDate.getTime())) return incomingDate;
  if (!incomingDate || isNaN(incomingDate.getTime())) return existingDate;

  return incomingDate > existingDate ? incomingDate : existingDate;
}

/**
 * Generic object merge with field-level strategies
 */
export function mergeObjects<T extends Record<string, unknown>>(
  existing: T | null | undefined,
  incoming: T | null | undefined,
  strategies?: Partial<Record<keyof T, 'value' | 'text' | 'number' | 'date'>>
): T | null {
  if (!existing && !incoming) return null;
  if (!existing) return incoming ?? null;
  if (!incoming) return existing;

  const result = { ...existing };

  for (const key of Object.keys(incoming) as (keyof T)[]) {
    const strategy = strategies?.[key] || 'value';
    const existingVal = existing[key];
    const incomingVal = incoming[key];

    switch (strategy) {
      case 'text':
        (result as Record<string, unknown>)[key as string] = mergeText(
          existingVal as string,
          incomingVal as string
        );
        break;
      case 'number':
        (result as Record<string, unknown>)[key as string] = mergeNumber(
          existingVal as number,
          incomingVal as number
        );
        break;
      case 'date':
        (result as Record<string, unknown>)[key as string] = mergeDate(
          existingVal as Date,
          incomingVal as Date
        );
        break;
      default:
        (result as Record<string, unknown>)[key as string] = mergeValue(existingVal, incomingVal);
    }
  }

  return result;
}

/**
 * Merge agent data with appropriate strategies per field
 */
export function mergeAgentData<T extends Record<string, unknown>>(
  existing: T | null,
  incoming: Partial<T>
): T {
  if (!existing) return incoming as T;

  return {
    ...existing,
    // Contact - prefer incoming (might be updated)
    email: mergeValue(existing.email, incoming.email),
    phone: mergeValue(existing.phone, incoming.phone),
    mobilePhone: mergeValue(existing.mobilePhone, incoming.mobilePhone),

    // Profile - prefer longer text
    bio: mergeText(existing.bio as string, incoming.bio as string),

    // Media - prefer incoming
    photoUrl: mergeValue(existing.photoUrl, incoming.photoUrl),

    // License - prefer incoming (status may change)
    licenseNumber: mergeValue(existing.licenseNumber, incoming.licenseNumber),
    licenseStatus: mergeValue(existing.licenseStatus, incoming.licenseStatus),
    licenseState: mergeValue(existing.licenseState, incoming.licenseState),

    // Stats - prefer incoming (more recent)
    yearsActive: mergeNumber(existing.yearsActive as number, incoming.yearsActive as number),
    ratingOverall: mergeNumber(existing.ratingOverall as number, incoming.ratingOverall as number),
    reviewCount: mergeNumber(existing.reviewCount as number, incoming.reviewCount as number),
    salesCount: mergeNumber(existing.salesCount as number, incoming.salesCount as number),
    dataQualityScore: mergeNumber(
      existing.dataQualityScore as number,
      incoming.dataQualityScore as number
    ),

    // Arrays - merge unique
    languagesSpoken: mergeValue(existing.languagesSpoken, incoming.languagesSpoken),
    specializations: mergeValue(existing.specializations, incoming.specializations),

    // Timestamps - always use newer
    lastScrapedAt: incoming.lastScrapedAt || existing.lastScrapedAt,
  } as T;
}

/**
 * Merge agency data with appropriate strategies per field
 */
export function mergeAgencyData<T extends Record<string, unknown>>(
  existing: T | null,
  incoming: Partial<T>
): T {
  if (!existing) return incoming as T;

  return {
    ...existing,
    // Identity - prefer incoming
    name: mergeValue(existing.name, incoming.name),
    brandName: mergeValue(existing.brandName, incoming.brandName),

    // Contact - prefer incoming
    phone: mergeValue(existing.phone, incoming.phone),
    email: mergeValue(existing.email, incoming.email),
    websiteUrl: mergeValue(existing.websiteUrl, incoming.websiteUrl),

    // Media - prefer incoming
    logoUrl: mergeValue(existing.logoUrl, incoming.logoUrl),

    // Address - prefer incoming
    streetAddress: mergeValue(existing.streetAddress, incoming.streetAddress),
    suburb: mergeValue(existing.suburb, incoming.suburb),
    state: mergeValue(existing.state, incoming.state),
    postcode: mergeValue(existing.postcode, incoming.postcode),
    lat: mergeNumber(existing.lat as number, incoming.lat as number),
    lng: mergeNumber(existing.lng as number, incoming.lng as number),

    // Profile - prefer longer
    description: mergeText(existing.description as string, incoming.description as string),

    // Timestamps - always use newer
    lastScrapedAt: incoming.lastScrapedAt || existing.lastScrapedAt,
  } as T;
}
