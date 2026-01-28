/**
 * Data quality scoring.
 * Formula: 0.3 profile + 0.3 sales + 0.2 reviews + 0.1 photo + 0.1 license
 */

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "bio",
  "yearsActive",
  "languagesSpoken",
  "specializations",
  "suburbsServiced",
] as const;

/**
 * Returns 0-100. Each field contributes equal weight toward completeness.
 */
export function computeProfileCompleteness(agent: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  yearsActive?: number | null;
  languagesSpoken?: string | null;
  specializations?: string | null;
  suburbsServiced?: string | null;
}): number {
  const total = PROFILE_FIELDS.length;
  let filled = 0;

  for (const field of PROFILE_FIELDS) {
    const value = agent[field];
    if (value != null && value !== "") {
      filled++;
    }
  }

  return Math.round((filled / total) * 100);
}

/**
 * Returns 0-100 composite data quality score.
 *
 * - profile (0.3): profileCompleteness (0-100) x 0.3
 * - sales  (0.3): min(totalSalesCount / 50, 1) x 100 x 0.3
 * - reviews(0.2): min(ratingsCount / 10, 1) x 100 x 0.2
 * - photo  (0.1): (photoUrl ? 100 : 0) x 0.1
 * - license(0.1): (licenseNumber ? 100 : 0) x 0.1
 */
export function computeDataQualityScore(agent: {
  profileCompleteness?: number;
  totalSalesCount?: number;
  ratingsCount?: number;
  photoUrl?: string | null;
  licenseNumber?: string | null;
}): number {
  const profile = (agent.profileCompleteness ?? 0) * 0.3;
  const sales = Math.min((agent.totalSalesCount ?? 0) / 50, 1) * 100 * 0.3;
  const reviews = Math.min((agent.ratingsCount ?? 0) / 10, 1) * 100 * 0.2;
  const photo = (agent.photoUrl ? 100 : 0) * 0.1;
  const license = (agent.licenseNumber ? 100 : 0) * 0.1;

  return Math.round(profile + sales + reviews + photo + license);
}
