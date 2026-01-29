/**
 * Domain Rate Limiter
 * Enforces per-domain request limits (default: 30 req/domain/min)
 */

export class DomainRateLimiter {
  private domainTimestamps = new Map<string, number[]>();
  private requestsPerMinute: number;
  private verbose: boolean;

  constructor(requestsPerMinute = 30, verbose = false) {
    this.requestsPerMinute = requestsPerMinute;
    this.verbose = verbose;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      // If not a valid URL, treat the whole string as domain
      return url;
    }
  }

  /**
   * Wait for a rate limit slot before making a request
   * @param url - The URL or domain to rate limit
   */
  async waitForSlot(url: string): Promise<void> {
    const domain = this.extractDomain(url);
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    // Get or create timestamps array for this domain
    let timestamps = this.domainTimestamps.get(domain) || [];

    // Filter out timestamps older than 1 minute
    timestamps = timestamps.filter(t => now - t < windowMs);

    // Check if we're at the limit
    if (timestamps.length >= this.requestsPerMinute) {
      // Calculate how long to wait
      const oldestTimestamp = timestamps[0];
      const waitMs = windowMs - (now - oldestTimestamp);

      if (waitMs > 0) {
        if (this.verbose) {
          console.log(`[RateLimiter] ${domain}: at limit (${this.requestsPerMinute}/min), waiting ${Math.ceil(waitMs / 1000)}s`);
        }
        await this.sleep(waitMs);
        // After waiting, clean up old timestamps again
        const newNow = Date.now();
        timestamps = timestamps.filter(t => newNow - t < windowMs);
      }
    }

    // Record this request
    timestamps.push(Date.now());
    this.domainTimestamps.set(domain, timestamps);

    if (this.verbose) {
      console.log(`[RateLimiter] ${domain}: ${timestamps.length}/${this.requestsPerMinute} requests in window`);
    }
  }

  /**
   * Get current request count for a domain
   */
  getRequestCount(url: string): number {
    const domain = this.extractDomain(url);
    const now = Date.now();
    const timestamps = this.domainTimestamps.get(domain) || [];
    return timestamps.filter(t => now - t < 60000).length;
  }

  /**
   * Reset all rate limit tracking
   */
  reset(): void {
    this.domainTimestamps.clear();
  }

  /**
   * Reset rate limit tracking for a specific domain
   */
  resetDomain(url: string): void {
    const domain = this.extractDomain(url);
    this.domainTimestamps.delete(domain);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default singleton instance
export const rateLimiter = new DomainRateLimiter();
