import { ShardingManager } from 'discord.js';
import { Log } from '../module';
import 'dotenv/config';
import 'colors';

export const shard = new ShardingManager(
  `${__dirname}/start.${process.argv[1].endsWith('.js') ? 'js' : 'ts'}`,
  {
    token: process.env.BOT_TOKEN,
    totalShards: 'auto',
    respawn: true,
    ...(process.argv[1].endsWith('.ts') && {
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

export class Shard {
  static async spawn() {
    return await shard.spawn({ timeout: -1 });
  }
}
