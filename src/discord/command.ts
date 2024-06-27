import {
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { glob } from 'glob';
import { getClientID } from './client';

interface RunOptions {
  client: Client;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  name: string[];
  command: (builder: SlashCommandBuilder) => any;
  guildId?: string[];
  run: RunFunction;
};

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export class ExtendedCommand {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}

export class Command {
  static async getCommands() {
    const result: { path: string; command: CommandType }[] = [];
    const commands = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../command/**/*{.ts,.js}`,
    );
    for (const path of commands)
      result.push({ path, command: (await import(path))?.default });
    return result;
  }

  static async registerCommands() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const client_id = await getClientID();
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const commands = await this.getCommands();

    await rest.put(Routes.applicationCommands(client_id), {
      body: commands
        .map((v) => v.command)
        .filter((v) => !v.guildId || v.guildId.length < 1)
        .map((v) =>
          v.name.map((_, idx) =>
            v.command(new SlashCommandBuilder().setName(v.name[idx])).toJSON(),
          ),
        )
        .reduce((a, b) => a.concat(b), []),
    });
  }

  static async registerGuildCommands(guilds: Guild[]) {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const client_id = await getClientID();
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const guildCommands: { [x: string]: CommandType[] } = {};
    const commands = await this.getCommands();

    for (const command of commands)
      if (command.command.guildId)
        for (const guildId of command.command.guildId) {
          if (!guildCommands[guildId]) guildCommands[guildId] = [];
          guildCommands[guildId].push(command.command);
        }

    for (const guild of guilds) {
      rest.put(Routes.applicationGuildCommands(client_id, guild.id), {
        body: guildCommands[guild.id] || [],
      });
    }
  }
}
