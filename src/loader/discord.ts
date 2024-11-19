import {
  Cluster,
  ExtendedApplicationCommand,
  ExtendedEvent,
  ExtendedTextCommand,
  Language,
} from '../structure';

export const discordInit = async () => {
  // Register Language Data for Register Commands
  await Language.init();

  // Initialize Commands & Events
  await ExtendedEvent.init();
  await ExtendedTextCommand.init();
  await ExtendedApplicationCommand.init();

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
