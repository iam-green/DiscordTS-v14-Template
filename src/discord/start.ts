import { GatewayIntentBits, Options } from 'discord.js';
import { getInfo } from 'discord-hybrid-sharding';
import { databaseInit } from '../database';
import { ExtendedClient } from './structure';
import 'dotenv/config';

const client = new ExtendedClient({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: { interval: 3600, lifetime: 1800 },
    users: {
      interval: 3600,
      filter: () => (user) => user.bot && user.id != user.client.user.id,
    },
  },
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

(async () => {
  await databaseInit();
  await client.start();
})();
