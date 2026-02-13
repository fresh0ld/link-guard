const fs = require('node:fs/promises');
const path = require('node:path');

const dataDir = path.join(__dirname, '../../data');
const eventsFile = path.join(dataDir, 'events.json');

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(eventsFile);
  } catch {
    await fs.writeFile(eventsFile, JSON.stringify({ events: [] }, null, 2), 'utf8');
  }
}

async function readEvents() {
  await ensureStore();
  const raw = await fs.readFile(eventsFile, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.events) ? parsed.events : [];
}

async function appendEvent(event) {
  await ensureStore();
  const events = await readEvents();
  events.push(event);
  const trimmed = events.slice(-5000);
  await fs.writeFile(eventsFile, JSON.stringify({ events: trimmed }, null, 2), 'utf8');
}

module.exports = {
  readEvents,
  appendEvent,
};
