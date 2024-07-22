import { GatewayIntentBits } from 'discord.js';
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
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});

(async () => {
  await databaseInit();
  await client.start();
})();
