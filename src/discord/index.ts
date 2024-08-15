import { Cluster } from './cluster';
import { Command } from './command';
import { Event } from './event';
import { Menu } from './menu';

export * from './client';
export * from './util';
export * from './language';
export * from './command';
export * from './menu';
export * from './event';
export * from './cluster';

export const discordInit = async () => {
  // Register Commands
  await Command.registerCommand(await Menu.getMenuJSON());
  await Command.registerGuildCommand(await Menu.getGuildMenuJSON());

  // Log Loaded Commands & Events & Menus
  await Event.logEvents();
  await Menu.logMenus();
  await Command.logCommands();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
};
