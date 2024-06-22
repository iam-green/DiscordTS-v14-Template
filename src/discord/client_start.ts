import { GatewayIntentBits } from 'discord.js';
import { ExtendedClient } from './client';

export const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

(async () => {
  await client.start();
})();
