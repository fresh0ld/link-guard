const { readEvents } = require('../logging/store');

function toDayKey(iso) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return 'invalid';
  }
}

function registerRoutes(app) {
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/events', async (req, res) => {
    const limit = Math.max(1, Math.min(500, Number.parseInt(req.query.limit || '100', 10)));
    const events = await readEvents();
    const sorted = [...events].sort((a, b) => (a.ts < b.ts ? 1 : -1));
    res.json({ events: sorted.slice(0, limit) });
  });

  app.get('/api/stats', async (req, res) => {
    const events = await readEvents();

    const totals = {
      analyzedLinks: events.length,
      suspiciousLinks: events.filter((e) => (e.score || 0) >= 60).length,
      highRiskLinks: events.filter((e) => (e.score || 0) >= 80).length,
    };

    const byDay = {};
    const byDomain = {};

    for (const e of events) {
      const day = toDayKey(e.ts);
      byDay[day] = byDay[day] || { total: 0, suspicious: 0 };
      byDay[day].total += 1;
      if ((e.score || 0) >= 60) byDay[day].suspicious += 1;

      const host = e.intel?.hostname || (() => {
        try {
          return new URL(e.url).hostname;
        } catch {
          return null;
        }
      })();

      if (host) {
        byDomain[host] = (byDomain[host] || 0) + 1;
      }
    }

    const topDomains = Object.entries(byDomain)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    res.json({ totals, byDay, topDomains });
  });
}

module.exports = { registerRoutes };
