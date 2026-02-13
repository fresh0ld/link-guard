const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getStats() {
  return fetchJson('/api/stats');
}

export async function getEvents(limit = 100) {
  return fetchJson(`/api/events?limit=${encodeURIComponent(limit)}`);
}
