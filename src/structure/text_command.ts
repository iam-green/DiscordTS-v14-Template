import { LocaleString, Message, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { Log } from '../module';

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
  public static commands = new Map<
    string[],
    {
      path: string;
      command: TextCommandType<boolean>;
    }
  >();

  constructor(textCommandOptions: TextCommandType<InGuild>) {
    Object.assign(this, textCommandOptions);
  }

  static async init() {
    const commandsPath = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../textCommand/**/*{.ts,.js}`,
    );
    for (const path of commandsPath)
      if ((await import(path))?.default instanceof ExtendedTextCommand) {
        const command = (await import(path)).default;
        const names = Array.isArray(command.name)
          ? command.name
          : [command.name];
        this.commands.set(names, { path, command });
      }
  }

  static async logCommands() {
    for (const [name, { path }] of this.commands)
      Log.debug(
        `Added ${chalk.green(Array.isArray(name) ? name[0] : name)} Text Command (Location : ${chalk.yellow(path)})`,
      );
  }
}
