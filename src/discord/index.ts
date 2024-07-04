import { KoreanBots, Log } from '../module';
import { Command } from './command';
import { Event } from './event';
import { Menu } from './menu';
import { Shard, shard } from './shard';

export * from './client';
export * from './command';
export * from './event';
export * from './menu';

export const discordInit = async () => {
  for (const { path, command } of await Command.registerCommands())
    for (const name of command.name)
      Log.debug(`Added ${name.green} Command (Location : ${path.yellow})`);

  for (const { path, command } of await Command.registerGuildCommands())
    for (const name of command.name)
      for (const guild_id of command.guildId || [])
        Log.debug(
          `Added ${name.green} Command for ${guild_id.blue} Guild (Location : ${path.yellow})`,
        );

  for (const { path, menu } of await Menu.getRegisteredMenus())
    for (const name of menu.name)
      Log.debug(`Added ${name.green} Context Menu (Location : ${path.yellow})`);

  for (const { path, menu } of await Menu.getRegisteredGuildMenus())
    for (const name of menu.name)
      for (const guild_id of menu.guildId || [])
        Log.debug(
          `Added ${name.green} Context Menu for ${guild_id.blue} Guild (Location : ${path.yellow})`,
        );

  for (const { path, event } of await Event.getEvents())
    Log.debug(`Added ${event.event.green} Event (Location : ${path.yellow})`);

  await Shard.spawn();
  await KoreanBots.init();
  setInterval(async () => KoreanBots.update(shard), 1000 * 60 * 10);
};
