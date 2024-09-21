import { Cluster, Language } from './module';
import {
  ExtendedApplicationCommand,
  ExtendedEvent,
  ExtendedTextCommand,
} from './structure';

export * from './structure';
export * from './module';

export const discordInit = async () => {
  // Register Language Data for Register Commands
  await Language.init();

  // Register Application Commands
  await ExtendedApplicationCommand.registerCommand();
  await ExtendedApplicationCommand.registerGuildCommand();

  // Log Loaded Commands & Events & Menus
  await ExtendedEvent.logEvents();
  await ExtendedTextCommand.logCommands();
  await ExtendedApplicationCommand.logCommands();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
};
