const { extractUrlsFromText } = require('../../analyzers/urlExtractor');
const { analyzeUrl } = require('../../analyzers/riskScorer');
const { appendEvent } = require('../../logging/store');
const { DomainRateLimiter } = require('../../utils/domainRateLimiter');

const limiter = new DomainRateLimiter({
  windowMs: Number.parseInt(process.env.DOMAIN_WINDOW_MS || '60000', 10),
  maxInWindow: Number.parseInt(process.env.DOMAIN_MAX_IN_WINDOW || '10', 10),
  cooldownMs: Number.parseInt(process.env.DOMAIN_COOLDOWN_MS || '300000', 10),
});

function registerMessageCreateHandler(client) {
  client.on('messageCreate', async (message) => {
    try {
      if (!message || !message.content) return;
      if (message.author?.bot) return;

      const urls = extractUrlsFromText(message.content);
      if (urls.length === 0) return;

      const threshold = Number.parseInt(process.env.RISK_THRESHOLD || '60', 10);

      for (const url of urls) {
        let hostname = null;
        try {
          hostname = new URL(url).hostname;
        } catch {
          hostname = null;
        }

        const rate = limiter.check((hostname || '').toLowerCase());
        if (!rate.allowed) {
          const event = {
            ts: new Date().toISOString(),
            guildId: message.guildId || null,
            channelId: message.channelId || null,
            messageId: message.id || null,
            authorId: message.author?.id || null,
            authorTag: message.author?.tag || null,
            url,
            score: 0,
            verdict: 'low',
            reasons: ['rate-limited'],
            intel: { hostname },
          };

          await appendEvent(event);
          continue;
        }

        const result = await analyzeUrl(url);

        const event = {
          ts: new Date().toISOString(),
          guildId: message.guildId || null,
          channelId: message.channelId || null,
          messageId: message.id || null,
          authorId: message.author?.id || null,
          authorTag: message.author?.tag || null,
          url,
          score: result.score,
          verdict: result.verdict,
          reasons: result.reasons,
          intel: result.intel,
        };

        await appendEvent(event);

        if (result.score >= threshold) {
          const modChannelId = process.env.MOD_ALERT_CHANNEL_ID;
          if (modChannelId) {
            const channel = await client.channels.fetch(modChannelId).catch(() => null);
            if (channel && channel.isTextBased && channel.isTextBased()) {
              await channel.send({
                content: `Link suspeito detectado (pontuação ${result.score}/100): ${url}\nMotivos: ${result.reasons.join(', ')}`,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
}

module.exports = { registerMessageCreateHandler };
