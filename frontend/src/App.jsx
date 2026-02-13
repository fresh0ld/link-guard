import React, { useEffect, useMemo, useState } from 'react';
import { getEvents, getStats } from './api.js';

function formatNumber(n) {
  if (typeof n !== 'number') return '-';
  return n.toLocaleString();
}

function scoreBadge(score) {
  const s = typeof score === 'number' ? score : 0;
  const label = s >= 80 ? 'Alto' : s >= 50 ? 'Médio' : 'Baixo';
  const cls = s >= 80 ? 'badge badgeHigh' : s >= 50 ? 'badge badgeMed' : 'badge badgeLow';
  return <span className={cls}>{label} ({s})</span>;
}

export default function App() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [s, e] = await Promise.all([getStats(), getEvents(200)]);
        if (!mounted) return;
        setStats(s);
        setEvents(e.events || []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 8000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [events]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <div className="title">Discord Link Guard</div>
          <div className="subtitle">Monitor de links suspeitos</div>
        </div>
        <div className="pill">Atualização automática: 8s</div>
      </header>

      {error ? (
        <div className="card error">{error}</div>
      ) : null}

      <section className="grid">
        <div className="card">
          <div className="k">Links analisados</div>
          <div className="v">{loading ? '...' : formatNumber(stats?.totals?.analyzedLinks)}</div>
        </div>
        <div className="card">
          <div className="k">Suspeitos (&gt;= 60)</div>
          <div className="v">{loading ? '...' : formatNumber(stats?.totals?.suspiciousLinks)}</div>
        </div>
        <div className="card">
          <div className="k">Alto risco (&gt;= 80)</div>
          <div className="v">{loading ? '...' : formatNumber(stats?.totals?.highRiskLinks)}</div>
        </div>
      </section>

      <section className="split">
        <div className="card">
          <div className="cardTitle">Domínios mais frequentes</div>
          <div className="list">
            {(stats?.topDomains || []).map((d) => (
              <div className="listRow" key={d.domain}>
                <div className="mono">{d.domain}</div>
                <div className="pill">{d.count}</div>
              </div>
            ))}
            {(!stats?.topDomains || stats.topDomains.length === 0) && !loading ? (
              <div className="muted">Sem dados ainda</div>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Atividade por dia</div>
          <div className="list">
            {Object.entries(stats?.byDay || {})
              .sort((a, b) => (a[0] < b[0] ? 1 : -1))
              .slice(0, 10)
              .map(([day, v]) => (
                <div className="listRow" key={day}>
                  <div className="mono">{day}</div>
                  <div className="muted">{v.suspicious}/{v.total}</div>
                </div>
              ))}
            {Object.keys(stats?.byDay || {}).length === 0 && !loading ? (
              <div className="muted">Sem dados ainda</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="cardTitle">Últimos eventos</div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Horário</th>
                <th>Domínio</th>
                <th>Risco</th>
                <th>URL</th>
                <th>Motivos</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.slice(0, 100).map((e) => (
                <tr key={`${e.ts}-${e.url}`}>
                  <td className="mono">{new Date(e.ts).toLocaleString()}</td>
                  <td className="mono">{e?.intel?.hostname || '-'}</td>
                  <td>{scoreBadge(e.score)}</td>
                  <td className="urlCell">
                    <a href={e.url} target="_blank" rel="noreferrer">{e.url}</a>
                  </td>
                  <td className="muted">{(e.reasons || []).join(', ')}</td>
                </tr>
              ))}
              {sortedEvents.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="muted">Sem eventos ainda</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
