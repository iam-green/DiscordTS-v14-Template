import { KoreanBots } from '../module';
import { Command } from './command';
import { Shard, shard } from './shard';

export * from './client';
export * from './command';
export * from './event';

export const discordInit = async () => {
  await Command.registerCommands();
  await Shard.spawn();
  await KoreanBots.update(shard);
  setInterval(async () => KoreanBots.update(shard), 1000 * 60 * 10);
};
