import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  LocalizationMap,
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
  name: string | string[];
  localization?: LocalizationMap | LocalizationMap[];
  builder: (
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

export interface CommandInfo {
  path: string;
  command: CommandType;
}

export type CommandBuilder = Record<
  string,
  | SlashCommandBuilder
  | Record<
      string,
      | SlashCommandSubcommandBuilder
      | Record<string, SlashCommandSubcommandBuilder>
    >
>;

export type CommandBuilderLocalization = Record<string, LocalizationMap | null>;

export class Command {
  private static allCommands: CommandInfo[] = [];
  private static commands: CommandInfo[] = [];
  private static guildCommands: CommandInfo[] = [];
  private static guildCommandsSorted: { [x: string]: CommandInfo[] } = {};

  static async getAllCommands() {
    if (this.allCommands.length < 1) {
      const commands = glob.sync(
        `${__dirname.replace(/\\/g, '/')}/../command/**/*{.ts,.js}`,
      );
      for (const path of commands)
        this.allCommands.push({ path, command: (await import(path))?.default });
    }
    return this.allCommands;
  }

  static async getCommands() {
    if (this.commands.length < 1)
      this.commands = (await this.getAllCommands()).filter(
        (command) =>
          !command.command.guildId || command.command.guildId.length < 1,
      );
    return this.commands;
  }

  static async getGuildCommands(sorted: boolean = true) {
    if (this.guildCommands.length < 1)
      this.guildCommands = (await this.getAllCommands()).filter(
        (command) =>
          command.command.guildId && command.command.guildId.length > 0,
      );
    if (Object.keys(this.guildCommandsSorted).length < 1)
      for (const command of this.guildCommands)
        for (const guildId of command.command.guildId || [])
          if (!this.guildCommandsSorted[guildId])
            this.guildCommandsSorted[guildId] = [command];
          else this.guildCommandsSorted[guildId].push(command);
    return sorted ? this.guildCommandsSorted : this.guildCommands;
  }

  static getCommandLocalization(
    command: CommandType,
    name: string,
    length: number,
  ) {
    if (!command.localization) return null;
    const localization = Array.isArray(command.localization)
      ? command.localization
      : [command.localization];
    const nameList = Array.isArray(command.name)
      ? command.name
      : [command.name];
    const result: LocalizationMap = {};
    const nameIdx = nameList.findIndex((v) => v.split(' ')[length] == name);
    if (nameIdx < 0) return null;
    Object.keys(localization[nameIdx]).forEach((key) => {
      result[key] = localization[nameIdx][key].split(' ')[length] || '';
    });
    return result;
  }

  private static _setConvertedCommand(
    command: CommandInfo,
    name: string,
    length: number,
  ) {
    const builder = (
      length == 0
        ? new SlashCommandBuilder()
        : new SlashCommandSubcommandBuilder()
    ).setName(name);
    const localization = this.getCommandLocalization(
      command.command,
      name,
      length,
    );
    if (localization) builder.setNameLocalizations(localization);
    return command.command.builder(builder);
  }

  static convertCommand(commands: CommandInfo[]) {
    const resultObject: CommandBuilder = {};
    const localization: CommandBuilderLocalization = {};
    for (const command of commands) {
      const nameLength = Array.isArray(command.command.name)
        ? command.command.name.length
        : 1;
      const localizationLength = Array.isArray(command.command.localization)
        ? command.command.localization.length
        : 1;
      if (command.command.localization && nameLength != localizationLength)
        throw new Error(
          'The Command Name length is different from the Localization length.',
        );
      for (const name of Array.isArray(command.command.name)
        ? command.command.name
        : [command.command.name]) {
        const nameList = name.split(' ');
        if (nameList.length == 2 && !resultObject[nameList[0]])
          resultObject[nameList[0]] = {};
        if (nameList.length == 3 && !resultObject[nameList[0]][nameList[1]])
          resultObject[nameList[0]][nameList[1]] = {};
        if (nameList.length <= 2)
          localization[nameList[0]] = this.getCommandLocalization(
            command.command,
            nameList[0],
            0,
          );
        if (nameList.length == 1)
          resultObject[nameList[0]] = this._setConvertedCommand(
            command,
            nameList[0],
            0,
          );
        else if (nameList.length == 2)
          resultObject[nameList[0]][nameList[1]] = this._setConvertedCommand(
            command,
            nameList[1],
            1,
          );
        else {
          localization[`${nameList[0]} ${nameList[1]}`] =
            this.getCommandLocalization(command.command, nameList[1], 1);
          resultObject[nameList[0]][nameList[1]][nameList[2]] =
            this._setConvertedCommand(command, nameList[2], 2);
        }
      }
    }

    const result: SlashCommandBuilder[] = [];
    for (const [key1, value1] of Object.entries(resultObject))
      if (value1 instanceof SlashCommandBuilder) result.push(value1);
      else {
        const slashCommand = new SlashCommandBuilder()
          .setName(key1)
          .setNameLocalizations(localization[key1])
          .setDescription(`'${key1}' SubCommand`);
        for (const [key2, value2] of Object.entries(value1))
          if (value2 instanceof SlashCommandSubcommandBuilder)
            slashCommand.addSubcommand(value2);
          else {
            const subSlashCommand = new SlashCommandSubcommandGroupBuilder()
              .setName(key2)
              .setNameLocalizations(localization[`${key1} ${key2}`])
              .setDescription(`'${key1} ${key2}' SubCommand Group`);
            for (const value3 of Object.values(value2))
              subSlashCommand.addSubcommand(value3);
            slashCommand.addSubcommandGroup(subSlashCommand);
          }
        result.push(slashCommand);
      }
    return result;
  }

  static async logCommands() {
    const commands = await this.getCommands();
    const guildCommands = (await this.getGuildCommands(true)) as {
      [x: string]: CommandInfo[];
    };
    for (const { path, command } of commands)
      for (const name of Array.isArray(command.name)
        ? command.name
        : [command.name])
        Log.debug(`Added ${name.green} Command (Location : ${path.yellow})`);

    for (const { path, command } of Object.keys(guildCommands)
      .map((v) => guildCommands[v])
      .flat())
      for (const name of Array.isArray(command.name)
        ? command.name
        : [command.name])
        for (const guild_id of command.guildId || [])
          Log.debug(
            `Added ${name.green} Command for ${guild_id.blue} Guild (Location : ${path.yellow})`,
          );
  }

  static async registerCommand(other_commands?: any[]) {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const command = this.convertCommand(await this.getCommands());
    await rest.put(Routes.applicationCommands(await DiscordUtil.clientId()), {
      body: [...command.map((v) => v.toJSON()), ...(other_commands || [])],
    });
  }

  static async registerGuildCommand(other_commands?: { [x: string]: any[] }) {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await DiscordUtil.clientId();

    const guildCommands = await this.getGuildCommands(true);
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
