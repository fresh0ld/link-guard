const dotenv = require('dotenv');

dotenv.config();

const { startWebServer } = require('./web/server');
const { startBot } = require('./bot/client');

async function main() {
  await startWebServer();
  await startBot();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
