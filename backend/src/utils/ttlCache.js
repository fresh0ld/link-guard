class TtlCache {
  constructor({ defaultTtlMs = 60_000, maxEntries = 5_000 } = {}) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  _now() {
    return Date.now();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this._now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    const expiresAt = this._now() + (typeof ttlMs === 'number' ? ttlMs : this.defaultTtlMs);
    this.map.set(key, { value, expiresAt });

    if (this.map.size > this.maxEntries) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
  }

  delete(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

module.exports = { TtlCache };
