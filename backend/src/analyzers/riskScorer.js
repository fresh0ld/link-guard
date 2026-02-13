const { expandUrl } = require('./expandUrl');
const { scoreHeuristics } = require('./scamHeuristics');
const { getDomainIntel } = require('./domainIntel');
const { checkReputation, scoreReputation } = require('./reputation');

function verdictFromScore(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

async function analyzeUrl(url) {
  let expanded = { finalUrl: url, redirects: 0, status: null };
  try {
    expanded = await expandUrl(url);
  } catch {
  }

  const heuristic = scoreHeuristics({ url, finalUrl: expanded.finalUrl });

  let score = heuristic.score;
  const reasons = [...heuristic.reasons];

  if ((expanded.redirects || 0) >= 3) {
    score = Math.min(100, score + 10);
    reasons.push('many-redirects');
  }

  const intel = await getDomainIntel(expanded.finalUrl);

  let reputation = null;
  const reputationEnabled = (process.env.REPUTATION_ENABLED || '1') !== '0';
  if (reputationEnabled) {
    reputation = await checkReputation(expanded.finalUrl);
    const repScore = scoreReputation(reputation);
    score = Math.min(100, score + repScore.score);
    reasons.push(...repScore.reasons);
  }

  return {
    url,
    finalUrl: expanded.finalUrl,
    score,
    verdict: verdictFromScore(score),
    reasons: Array.from(new Set(reasons)),
    intel: {
      ...intel,
      httpStatus: expanded.status,
      redirects: expanded.redirects,
      reputation,
    },
  };
}

module.exports = { analyzeUrl };
