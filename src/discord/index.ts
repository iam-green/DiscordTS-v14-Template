import { Cluster } from './cluster';
import { Command } from './command';
import { Event } from './event';
import { Menu } from './menu';

export * from './client';
export * from './command';
export * from './event';
export * from './menu';
export * from './util';
export * from './cluster';

export const discordInit = async () => {
  await Command.registerCommand(await Menu.getMenuJSON());
  await Command.registerGuildCommand(await Menu.getGuildMenuJSON());

  await Command.logCommands();
  await Menu.logMenus();
  await Event.logEvents();

  await Cluster.spawn();
};
