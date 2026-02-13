const axios = require('axios');
const { TtlCache } = require('../utils/ttlCache');

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 5000;

const cache = new TtlCache({ defaultTtlMs: 10 * 60 * 1000, maxEntries: 5000 });

async function expandUrl(url) {
  const cacheKey = `expand:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const ttlMs = Number.parseInt(process.env.EXPAND_CACHE_TTL_MS || '600000', 10);

  let resp;
  try {
    resp = await axios.get(url, {
      maxRedirects: DEFAULT_MAX_REDIRECTS,
      timeout: DEFAULT_TIMEOUT_MS,
      validateStatus: () => true,
      responseType: 'text',
    });
  } catch {
    const fallback = { finalUrl: url, status: null, redirects: 0, chain: [] };
    cache.set(cacheKey, fallback, Math.min(30_000, ttlMs));
    return fallback;
  }

  const finalUrl = resp?.request?.res?.responseUrl || url;
  const chain = [];

  const redirects = resp?.request?._redirectable?._redirectCount;
  if (typeof redirects === 'number') {
    chain.push({ redirects });
  }

  const out = {
    finalUrl,
    status: resp.status,
    redirects: redirects || 0,
    chain,
  };

  cache.set(cacheKey, out, ttlMs);

  return out;
}

module.exports = { expandUrl };
