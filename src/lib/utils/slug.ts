import slugify from "slugify";

/**
 * Base slug generator: lowercase, trim, apostrophes removed,
 * & → "and", non-alphanumeric → hyphen, collapse hyphens, trim edge hyphens.
 */
export function generateSlug(input: string): string {
  // Pre-process: remove apostrophes, replace & with "and"
  const preprocessed = input.replace(/'/g, "").replace(/&/g, "and");

  const slug = slugify(preprocessed, {
    lower: true,
    strict: true, // strip non-word chars (except hyphens)
    trim: true,
  });

  // Collapse consecutive hyphens, trim leading/trailing hyphens
  return slug
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Agent slug with collision-avoidance strategy.
 *
 * Returns a generator that yields slugs in order of preference:
 *   1. "firstname-lastname"
 *   2. "firstname-lastname-suburb" (if suburb provided)
 *   3. "firstname-lastname-2", "firstname-lastname-3", ...
 *
 * Caller checks for collisions and calls next() to get the next candidate.
 */
export function generateAgentSlug(
  firstName: string,
  lastName: string,
  suburb?: string
): AgentSlugGenerator {
  return new AgentSlugGenerator(firstName, lastName, suburb);
}

export class AgentSlugGenerator {
  private base: string;
  private suburbSlug: string | null;
  private counter = 2;
  private phase: "base" | "suburb" | "numeric" = "base";

  constructor(firstName: string, lastName: string, suburb?: string) {
    this.base = generateSlug(`${firstName} ${lastName}`);
    this.suburbSlug = suburb ? generateSlug(suburb) : null;
  }

  /** Get the next slug candidate. */
  next(): string {
    switch (this.phase) {
      case "base":
        this.phase = this.suburbSlug ? "suburb" : "numeric";
        return this.base;

      case "suburb":
        this.phase = "numeric";
        return `${this.base}-${this.suburbSlug}`;

      case "numeric": {
        const slug = `${this.base}-${this.counter}`;
        this.counter++;
        return slug;
      }
    }
  }
}

/**
 * Agency slug from agency name.
 */
export function generateAgencySlug(name: string): string {
  return generateSlug(name);
}

/**
 * Suburb slug: always "name-state" format, e.g. "bondi-beach-nsw".
 */
export function generateSuburbSlug(name: string, state: string): string {
  return generateSlug(`${name} ${state}`);
}
