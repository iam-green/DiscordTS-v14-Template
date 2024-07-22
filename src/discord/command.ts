import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { glob } from 'glob';
import { Log } from '../module';
import { DiscordUtil } from './util';
import { ExtendedClient } from './client';

interface RunOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

export type CommandType = {
  name: string[];
  command: (
    builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  ) => any;
  guildId?: string[];
  run: (options: RunOptions) => any;
};

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export class ExtendedCommand {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}

export interface CommandBuilderList {
  [x: string]:
    | SlashCommandBuilder
    | {
        [x: string]:
          | SlashCommandSubcommandBuilder
          | { [x: string]: SlashCommandSubcommandBuilder };
      };
}

export interface Commands {
  data: {
    path: string;
    command: CommandType;
  }[];
  json: any[];
}

export class Command {
  private static commands?: Commands;
  private static guildCommands?: { [x: string]: Commands };

  static commandToJson(commands: CommandType[]): CommandBuilderList {
    const result: CommandBuilderList = {};
    for (const command of commands)
      for (const name of command.name) {
        const nameList = name.split(' ');
        if (nameList.length == 1) {
          result[nameList[0]] = command.command(
            new SlashCommandBuilder().setName(nameList[0]),
          );
        } else {
          if (
            !commands.find((v) => v.command.name.includes(nameList[0])) &&
            !result[nameList[0]]
          )
            result[nameList[0]] = {};
          if (nameList.length == 2) {
            result[nameList[0]][nameList[1]] = command.command(
              new SlashCommandSubcommandBuilder().setName(nameList[1]),
            );
          } else {
            if (
              !commands.find((v) =>
                v.command.name.includes(`${nameList[0]} ${nameList[1]}`),
              ) &&
              !result[nameList[0]][nameList[1]]
            )
              result[nameList[0]][nameList[1]] = {};
            result[nameList[0]][nameList[1]][nameList[2]] = command.command(
              new SlashCommandSubcommandBuilder().setName(nameList[2]),
            );
          }
        }
      }
    return result;
  }

  static jsonToBuilder(list: CommandBuilderList): SlashCommandBuilder[] {
    const result: SlashCommandBuilder[] = [];
    for (const [key1, value1] of Object.entries(list))
      if (value1 instanceof SlashCommandBuilder) result.push(value1);
      else {
        const slashCommand = new SlashCommandBuilder()
          .setName(key1)
          .setDescription(`'${key1}' 서브 명령어`);
        for (const [key2, value2] of Object.entries(value1))
          if (value2 instanceof SlashCommandSubcommandBuilder)
            slashCommand.addSubcommand(value2);
          else {
            const subSlashCommand = new SlashCommandSubcommandGroupBuilder()
              .setName(key2)
              .setDescription(`'${key1} ${key2}' 서브 명령어 그룹`);
            for (const value3 of Object.values(value2))
              subSlashCommand.addSubcommand(value3);
            slashCommand.addSubcommandGroup(subSlashCommand);
          }
        result.push(slashCommand);
      }
    return result;
  }

  static async getAllCommands() {
    const result: { path: string; command: CommandType }[] = [];
    const commands = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../command/**/*{.ts,.js}`,
    );
    for (const path of commands)
      result.push({ path, command: (await import(path))?.default });
    return result;
  }

  static async getCommands() {
    if (!this.commands) {
      const commands = (await this.getAllCommands()).filter(
        (v) => !v.command.guildId || v.command.guildId.length < 1,
      );
      this.commands = {
        data: commands,
        json: this.jsonToBuilder(
          this.commandToJson(commands.map((v) => v.command)),
        ).map((v) => v.toJSON()),
      };
    }
    return this.commands;
  }

  static async getGuildCommands() {
    if (!this.guildCommands) {
      const commands = (await this.getAllCommands()).filter(
        (v) => v.command.guildId && v.command.guildId.length > 0,
      );

      const result: { [x: string]: Commands } = {};

      for (const command of commands)
        for (const guild_id of command.command.guildId!) {
          if (!result[guild_id]) result[guild_id] = { data: [], json: [] };
          result[guild_id].data.push(command);
        }

      for (const [key, value] of Object.entries(result))
        result[key].json.push(
          this.jsonToBuilder(
            this.commandToJson(value.data.map((v) => v.command)),
          ).map((v) => v.toJSON()),
        );

      this.guildCommands = result;
    }
    return this.guildCommands;
  }

  static async logCommands() {
    const commands = await this.getCommands();
    const guildCommands = await this.getGuildCommands();
    for (const { path, command } of commands.data)
      for (const name of command.name)
        Log.debug(`Added ${name.green} Command (Location : ${path.yellow})`);

    for (const { path, command } of Object.keys(guildCommands)
      .map((v) => guildCommands[v].data)
      .flat())
      for (const name of command.name)
        for (const guild_id of command.guildId || [])
          Log.debug(
            `Added ${name.green} Command for ${guild_id.blue} Guild (Location : ${path.yellow})`,
          );
  }

  static async registerCommand(other_commands?: any[]) {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    await rest.put(Routes.applicationCommands(await DiscordUtil.clientId()), {
      body: [...(await this.getCommands()).json, ...(other_commands || [])],
    });
  }

  static async registerGuildCommand(other_commands?: { [x: string]: any[] }) {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await DiscordUtil.clientId();

    const guildCommands = await this.getGuildCommands();
    const list: { [x: string]: any[] } = {};
    for (const key of Object.keys(
      Object.assign(guildCommands, other_commands),
    )) {
      if (!list[key]) list[key] = [];
      if (guildCommands[key]) list[key].push(guildCommands[key].json);
      if (other_commands && other_commands[key])
        list[key].push(other_commands[key]);
    }

    for (const [guild_id, body] of Object.entries(list))
      await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
        body,
      });
  }
}
