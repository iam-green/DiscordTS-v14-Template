import { shard } from '.';
import { Log } from '../module';
import { KoreanBots } from '../module/koreanbots';
import { client } from './start';

export * from './client';
export * from './command';
export * from './event';
export * from './start';
export * from './shard';

export const discordInit = async () => {
  await shard.spawn();
  Log.info(`Logged in as ${client.user?.tag.green}!`);
  await KoreanBots.update();
  setInterval(async () => await KoreanBots.update(), 1000 * 60 * 60);
};
