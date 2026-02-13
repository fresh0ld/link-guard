const express = require('express');
const cors = require('cors');

const { registerRoutes } = require('./routes');

let app;

async function startWebServer() {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin }));

  registerRoutes(app);

  await new Promise((resolve) => {
    app.listen(port, () => resolve());
  });

  return app;
}

function getApp() {
  return app;
}

module.exports = {
  startWebServer,
  getApp,
};
