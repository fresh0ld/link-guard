const KEYWORDS = [
  'free nitro',
  'nitro free',
  'discord nitro',
  'claim',
  'gift',
  'giveaway',
  'airdrop',
  'limited',
  'steam',
  'skin',
  'csgo',
  'robux',
  'pix',
  'premio',
  'reward',
  'verify',
  'login',
];

const SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'cutt.ly',
  'rebrand.ly',
  'is.gd',
];

const SUSPICIOUS_TLDS = ['xyz', 'top', 'click', 'icu', 'info', 'shop', 'site'];

function getHostnameParts(hostname) {
  const lower = (hostname || '').toLowerCase();
  return lower.split('.').filter(Boolean);
}

function looksLikeDiscordTyposquat(hostname) {
  const h = (hostname || '').toLowerCase();
  if (h === 'discord.com' || h.endsWith('.discord.com')) return false;

  const variants = ['disc0rd', 'd1scord', 'dlscord', 'dіscord', 'díscord'];
  return variants.some((v) => h.includes(v));
}

function scoreHeuristics({ url, finalUrl }) {
  const reasons = [];
  let score = 0;

  const u = new URL(finalUrl || url);
  const text = `${u.hostname} ${u.pathname} ${u.search}`.toLowerCase();

  for (const kw of KEYWORDS) {
    if (text.includes(kw)) {
      score += 15;
      reasons.push(`keyword:${kw}`);
    }
  }

  if (SHORTENERS.includes(u.hostname.toLowerCase())) {
    score += 20;
    reasons.push('shortener');
  }

  if ((u.hostname || '').toLowerCase().startsWith('xn--')) {
    score += 25;
    reasons.push('punycode');
  }

  if (looksLikeDiscordTyposquat(u.hostname)) {
    score += 35;
    reasons.push('discord-typosquat');
  }

  const parts = getHostnameParts(u.hostname);
  const tld = parts[parts.length - 1];
  if (tld && SUSPICIOUS_TLDS.includes(tld)) {
    score += 10;
    reasons.push(`tld:${tld}`);
  }

  if (u.pathname.toLowerCase().includes('nitro') || u.pathname.toLowerCase().includes('gift')) {
    score += 10;
    reasons.push('path-suspicious');
  }

  score = Math.min(100, score);

  return { score, reasons };
}

module.exports = { scoreHeuristics };
