const dns = require('node:dns/promises');
const { TtlCache } = require('../utils/ttlCache');

const cache = new TtlCache({ defaultTtlMs: 10 * 60 * 1000, maxEntries: 10000 });

async function resolveIps(hostname) {
  const cacheKey = `dns:${hostname}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const ttlMs = Number.parseInt(process.env.DNS_CACHE_TTL_MS || '600000', 10);

  try {
    const results = await dns.lookup(hostname, { all: true });
    const ips = results.map((r) => r.address);
    const unique = Array.from(new Set(ips));
    cache.set(cacheKey, unique, ttlMs);
    return unique;
  } catch {
    cache.set(cacheKey, [], ttlMs);
    return [];
  }
}

async function getDomainIntel(url) {
  const u = new URL(url);
  const hostname = u.hostname;

  const ips = await resolveIps(hostname);

  return {
    hostname,
    ips,
  };
}

module.exports = { getDomainIntel };
