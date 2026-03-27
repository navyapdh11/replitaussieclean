interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  constructor(pruneIntervalMs = 60_000) {
    // Periodically evict expired entries to prevent unbounded memory growth
    this.pruneTimer = setInterval(() => this.prune(), pruneIntervalMs);
    // Allow the process to exit even if this timer is running
    if (this.pruneTimer.unref) this.pruneTimer.unref();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  /** Remove all expired entries */
  prune(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) this.store.delete(k);
    }
  }

  destroy(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    this.store.clear();
  }
}

export const pricingCache   = new TtlCache<number>(60_000);
export const adminFactorCache = new TtlCache<number>(60_000);
