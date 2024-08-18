import { Cluster } from './module';
import { Command, Event, Menu, TextCommand } from './structure';

export * from './structure';
export * from './module';

export const discordInit = async () => {
  // Register Commands
  await Command.registerCommand(await Menu.getMenuJSON());
  await Command.registerGuildCommand(await Menu.getGuildMenuJSON());

  // Log Loaded Commands & Events & Menus
  await Event.logEvents();
  await Menu.logMenus();
  await TextCommand.logCommands();
  await Command.logCommands();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
};
