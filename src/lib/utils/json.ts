/**
 * JSON field helpers for SQLite text columns storing JSON.
 */

/** Safely parse a JSON array from a text column; returns [] on null/error. */
export function parseJsonArray(raw: string | null): string[] {
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/** Serialize a string array for storage in a text column. */
export function serializeJsonArray(arr: string[]): string {
  return JSON.stringify(arr);
}

/** Generic JSON parse from a text column; returns null on null/error. */
export function parseJsonField<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Serialize any value to JSON for storage in a text column. */
export function serializeJsonField<T>(value: T): string {
  return JSON.stringify(value);
}
