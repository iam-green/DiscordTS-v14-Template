import { GatewayIntentBits } from 'discord.js';
import { getInfo } from 'discord-hybrid-sharding';
import { ExtendedClient } from './client';
import { databaseInit } from '../database';
import { Log } from '../module';
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

client.on('shardReady', (id) => {
  Log.info(
    `${'['.cyan}Cluster ${`#${getInfo().CLUSTER}`.green}${']'.cyan} Shard ${`#${id}`.green} is ready!`
      .green,
  );
});

client.on('shardDisconnect', (_, id) => {
  Log.warn(
    `${'['.cyan}Cluster ${`#${getInfo().CLUSTER}`.green}${']'.cyan} Shard ${`#${id}`.green} is disconnected.`
      .yellow,
  );
});

client.on('shardReconnecting', (id) => {
  Log.warn(
    `${'['.cyan}Cluster ${`#${getInfo().CLUSTER}`.green}${']'.cyan} Shard ${`#${id}`.green} is reconnecting...`
      .yellow,
  );
});

(async () => {
  await databaseInit(`${'['.cyan}Cluster ${`#${getInfo().CLUSTER}`.green}`);
  await client.start();
})();
