import { Cluster, Language } from './module';
import { ApplicationCommand, Event, TextCommand } from './structure';

export * from './structure';
export * from './module';

export const discordInit = async () => {
  // Register Language Data for Register Commands
  await Language.init();

  // Register Application Commands
  await ApplicationCommand.registerCommand();
  await ApplicationCommand.registerGuildCommand();

  // Log Loaded Commands & Events & Menus
  await Event.logEvents();
  await TextCommand.logCommands();
  await ApplicationCommand.logCommands();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
};
