import { KoreanBots } from '../module';
import { Command } from './command';
import { Event } from './event';
import { Menu } from './menu';
import { Shard, shard } from './shard';

export * from './client';
export * from './command';
export * from './event';
export * from './menu';
export * from './util';

export const discordInit = async () => {
  await Command.registerCommand(await Menu.getMenuJSON());
  await Command.registerGuildCommand(await Menu.getGuildMenuJSON());

  await Command.logCommands();
  await Menu.logMenus();
  await Event.logEvents();

  await Shard.spawn();
  await KoreanBots.init();
  setInterval(async () => KoreanBots.update(shard), 1000 * 60 * 10);
};
