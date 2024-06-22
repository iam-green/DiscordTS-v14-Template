import { ShardingManager } from 'discord.js';
import { Log } from '../module';

export const shard = new ShardingManager(
  process.argv[1].endsWith('.js')
    ? './dist/discord/client_start.js'
    : './src/discord/client_start.ts',
  {
    token: process.env.BOT_TOKEN,
    totalShards: 'auto',
    respawn: true,
    ...(process.env.RUN_MODE != 'start' && {
      execArgv: ['-r', 'ts-node/register'],
    }),
  },
);

shard.on('shardCreate', (shard) => {
  Log.info(`Launching Shard ${`#${shard.id}`.green}...`);
  shard.on('ready', () => Log.info(`Shard ${`#${shard.id}`.green} is Ready!`));
  shard.on('disconnect', () =>
    Log.info(`Shard ${`#${shard.id}`.green} Disconnrected.`),
  );
  shard.on('reconnecting', () =>
    Log.info(`Shard ${`#${shard.id}`.green} Reconnecting...`),
  );
  shard.on('death', () => Log.info(`Shard ${`#${shard.id}`.green} Died.`));
});
