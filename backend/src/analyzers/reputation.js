const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 7000;

async function checkUrlhaus(url) {
  try {
    const body = new URLSearchParams({ url });

    const res = await axios.post('https://urlhaus-api.abuse.ch/v1/url/', body.toString(), {
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: () => true,
    });

    if (!res || res.status !== 200 || !res.data) {
      return { ok: false, provider: 'urlhaus' };
    }

    const data = res.data;
    if (data.query_status && data.query_status !== 'ok') {
      return { ok: true, provider: 'urlhaus', status: 'unknown', queryStatus: data.query_status };
    }

    const urlStatus = (data.url_status || '').toLowerCase();
    const threat = data.threat || null;

    if (urlStatus === 'online' || urlStatus === 'offline') {
      return { ok: true, provider: 'urlhaus', status: 'listed', urlStatus, threat };
    }

    return { ok: true, provider: 'urlhaus', status: 'unknown' };
  } catch {
    return { ok: false, provider: 'urlhaus' };
  }
}

function toBase64Url(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function checkVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { ok: false, provider: 'virustotal', skipped: true };

  try {
    const submitBody = new URLSearchParams({ url });
    const submitRes = await axios.post('https://www.virustotal.com/api/v3/urls', submitBody.toString(), {
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-apikey': apiKey,
      },
      validateStatus: () => true,
    });

    const id = submitRes?.data?.data?.id || toBase64Url(url);

    const res = await axios.get(`https://www.virustotal.com/api/v3/urls/${encodeURIComponent(id)}`, {
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'x-apikey': apiKey,
      },
      validateStatus: () => true,
    });

    if (!res || res.status !== 200 || !res.data) {
      return { ok: false, provider: 'virustotal' };
    }

    const stats = res.data?.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return { ok: true, provider: 'virustotal', status: 'unknown' };
    }

    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);

    return {
      ok: true,
      provider: 'virustotal',
      status: 'ok',
      stats: { malicious, suspicious },
    };
  } catch {
    return { ok: false, provider: 'virustotal' };
  }
}

async function checkReputation(url) {
  const [urlhaus, virustotal] = await Promise.all([checkUrlhaus(url), checkVirusTotal(url)]);
  return { urlhaus, virustotal };
}

function scoreReputation(rep) {
  const reasons = [];
  let score = 0;

  if (rep?.urlhaus?.ok && rep.urlhaus.status === 'listed') {
    score += 40;
    reasons.push('reputacao:urlhaus');
  }

  const vt = rep?.virustotal;
  if (vt?.ok && vt.stats) {
    if ((vt.stats.malicious || 0) >= 1) {
      score += 50;
      reasons.push('reputacao:virustotal-malicioso');
    } else if ((vt.stats.suspicious || 0) >= 1) {
      score += 25;
      reasons.push('reputacao:virustotal-suspeito');
    }
  }

  return { score: Math.min(100, score), reasons };
}

module.exports = {
  checkReputation,
  scoreReputation,
};
