import { GatewayIntentBits, Options } from 'discord.js';
import { getInfo } from 'discord-hybrid-sharding';
import { ExtendedClient } from './client';
import { databaseInit } from '../database';
import 'dotenv/config';
import 'colors';

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
      filter: () => (user) => user.bot && user.id !== user.client.user.id,
    },
  },
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

(async () => {
  await databaseInit(
    `${'['.cyan}Cluster ${`#${getInfo().CLUSTER}`.green}${']'.cyan}`,
  );
  await client.start();
})();
