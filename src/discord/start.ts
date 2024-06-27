import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './client';
import { databaseInit } from '../database';

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

(async () => {
  await databaseInit();
  await client.start();
})();
