const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { registerMessageCreateHandler } = require('./events/messageCreate');

let client;

async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error('DISCORD_TOKEN não informado');
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  registerMessageCreateHandler(client);

  await client.login(token);

  return client;
}

function getClient() {
  return client;
}

module.exports = {
  startBot,
  getClient,
};
