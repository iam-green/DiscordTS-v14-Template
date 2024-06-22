import { shard } from '.';
import { Log } from '../module';
import { client } from './client_start';

export * from './client';
export * from './command';
export * from './event';
export * from './client_start';
export * from './shard';

export const discordInit = async () => {
  await shard.spawn();
  Log.info(`Logged in as \x1b[33m${client.user?.tag}\x1b[0m!`);
};
