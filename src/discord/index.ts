import { Cluster } from './cluster';
import { Command } from './command';
import { Event } from './event';

export * from './client';
export * from './util';
export * from './language';
export * from './command';
export * from './event';
export * from './cluster';

export const discordInit = async () => {
  // Register Commands
  await Command.registerCommand();
  await Command.registerGuildCommand();

  // Log Loaded Commands & Events
  await Event.logEvents();
  await Command.logCommands();

  // Spawn Discord Client Cluster
  await Cluster.spawn();
};
