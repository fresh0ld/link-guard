function extractUrlsFromText(text) {
  if (!text) return [];

  const regex = /https?:\/\/[^\s<>()]+/gi;
  const matches = text.match(regex) || [];

  const urls = [];
  for (const raw of matches) {
    try {
      const cleaned = raw.replace(/[\]\[),.!?;:]+$/g, '');
      const u = new URL(cleaned);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        urls.push(u.toString());
      }
    } catch {
    }
  }

  return Array.from(new Set(urls));
}

module.exports = { extractUrlsFromText };
