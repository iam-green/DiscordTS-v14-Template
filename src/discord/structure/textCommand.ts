import { LocaleString, Message, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { Log } from '../../module';

export type TextCommandType<InGuild extends boolean> = {
  name: string | string[];
  guildId?: string[];
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[];
      bot: PermissionResolvable[];
    }>;
    cooldown: number;
    onlyGuild: InGuild;
    botAdmin: boolean;
    botDeveloper: boolean;
    guildOwner: boolean;
  }>;
  run: (options: {
    client: ExtendedClient;
    message: Message<InGuild>;
    locale: LocaleString;
  }) => void;
};

export class ExtendedTextCommand<InGuild extends boolean> {
  constructor(textCommandOptions: TextCommandType<InGuild>) {
    Object.assign(this, textCommandOptions);
  }

  static async getCommands() {
    const result: { path: string; command: TextCommandType<boolean> }[] = [];
    const events = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../../textCommand/**/*{.ts,.js}`,
    );
    for (const path of events)
      if ((await import(path))?.default instanceof ExtendedTextCommand)
        result.push({ path, command: (await import(path)).default });
    return result;
  }

  static async logCommands() {
    for (const { path, command } of await this.getCommands())
      Log.debug(
        `Added ${chalk.green(Array.isArray(command.name) ? command.name[0] : command.name)} Text Command (Location : ${chalk.yellow(path)})`,
      );
  }
}
