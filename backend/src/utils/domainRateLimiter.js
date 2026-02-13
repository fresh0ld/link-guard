class DomainRateLimiter {
  constructor({ windowMs = 60_000, maxInWindow = 10, cooldownMs = 300_000, maxEntries = 10_000 } = {}) {
    this.windowMs = windowMs;
    this.maxInWindow = maxInWindow;
    this.cooldownMs = cooldownMs;
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  _now() {
    return Date.now();
  }

  _get(domain) {
    const d = this.map.get(domain);
    if (!d) return null;

    if (d.cooldownUntil && d.cooldownUntil > this._now()) return d;

    if (d.windowStart + this.windowMs <= this._now()) {
      d.windowStart = this._now();
      d.count = 0;
      d.cooldownUntil = 0;
    }

    return d;
  }

  check(domain) {
    if (!domain) return { allowed: true };

    const now = this._now();
    let state = this._get(domain);

    if (!state) {
      state = { windowStart: now, count: 0, cooldownUntil: 0 };
      this.map.set(domain, state);

      if (this.map.size > this.maxEntries) {
        const firstKey = this.map.keys().next().value;
        if (firstKey !== undefined) this.map.delete(firstKey);
      }
    }

    if (state.cooldownUntil && state.cooldownUntil > now) {
      return { allowed: false, retryAfterMs: state.cooldownUntil - now };
    }

    state.count += 1;

    if (state.count > this.maxInWindow) {
      state.cooldownUntil = now + this.cooldownMs;
      return { allowed: false, retryAfterMs: this.cooldownMs };
    }

    return { allowed: true };
  }
}

module.exports = { DomainRateLimiter };
