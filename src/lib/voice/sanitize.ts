'use client';

/**
 * Sanitize a value for JSON serialization.
 * Removes circular references, DOM objects, functions, and other non-serializable values.
 */
export function sanitizeForJson(value: unknown, depth = 0, seen?: WeakSet<object>): unknown {
  if (depth > 6) return '[MaxDepth]';

  if (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;

  if (typeof value !== 'object') return String(value);

  const obj = value as object;
  const seenSet = seen ?? new WeakSet<object>();
  if (seenSet.has(obj)) return '[Circular]';
  seenSet.add(obj);

  // Common non-plain objects we never want to serialize deeply.
  if (typeof window !== 'undefined' && obj === window) return '[Window]';
  if (obj instanceof Error) return { name: obj.name, message: obj.message };
  if (obj instanceof URL) return obj.toString();
  if (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement) {
    return { tagName: obj.tagName, id: obj.id || undefined };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJson(item, depth + 1, seenSet));
  }

  const proto = Object.getPrototypeOf(obj);
  const isPlain = proto === Object.prototype || proto === null;
  if (!isPlain) {
    // Last resort: avoid attempting to serialize class instances (can contain cycles).
    const name =
      (obj as { constructor?: { name?: string } }).constructor?.name ?? 'Object';
    return `[${name}]`;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = sanitizeForJson(v, depth + 1, seenSet);
    if (next !== undefined) out[k] = next;
  }
  return out;
}

/**
 * Safely stringify an object, handling circular references.
 * Returns the JSON string or throws with a helpful error.
 */
export function safeStringify(value: unknown): string {
  const sanitized = sanitizeForJson(value);
  return JSON.stringify(sanitized);
}
