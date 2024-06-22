import { shard } from '.';

export * from './client';
export * from './command';
export * from './event';
export * from './client_start';
export * from './shard';

export const discordInit = async () => {
  await shard.spawn();
};
