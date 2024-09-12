import {
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  LocalizationMap,
  PermissionResolvable,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { Log } from '../../module';
import { DiscordUtil } from '../module';

export class ExtendedCommand {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}

export type AutoCompleteOptions = {
  client: ExtendedClient;
  interaction: AutocompleteInteraction;
  args: AutocompleteInteraction['options'];
};

export type RunOptions = {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
};

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export type CommandType = {
  name: string | string[];
  description: string | string[];
  localization?: Partial<{
    name: LocalizationMap | LocalizationMap[];
    description: LocalizationMap | LocalizationMap[];
  }>;
  command?:
    | Omit<
        APIApplicationCommandSubcommandOption,
        | 'type'
        | 'name'
        | 'name_localizations'
        | 'description'
        | 'description_localizations'
      >
    | ((
        builder: SlashCommandSubcommandBuilder,
      ) => SlashCommandSubcommandBuilder);
  options?: Partial<{
    guildId: string[];
    permission: Partial<{
      user: PermissionResolvable[];
      bot: PermissionResolvable[];
    }>;
    cooldown: number;
    onlyGuild: boolean;
    botAdmin: boolean;
    botDeveloper: boolean;
    guildOwner: boolean;
  }>;
  run: (options: RunOptions) => void;
  autoComplete?: (options: AutoCompleteOptions) => void;
};

export type CommandInfo = {
  path: string;
  command: CommandType;
};

export class Command {
  private static allCommands: CommandInfo[] = [];
  private static commands: CommandInfo[] = [];
  private static guildCommands: CommandInfo[] = [];
  private static guildCommandsSorted: { [x: string]: CommandInfo[] } = {};

  static async getAllCommands() {
    if (this.allCommands.length < 1) {
      const commands = glob.sync(
        `${__dirname.replace(/\\/g, '/')}/../../command/**/*{.ts,.js}`,
      );
      for (const path of commands)
        if ((await import(path))?.default instanceof ExtendedCommand)
          this.allCommands.push({
            path,
            command: (await import(path)).default,
          });
    }
    return this.allCommands;
  }

  static async getCommands() {
    if (this.commands.length < 1)
      this.commands = (await this.getAllCommands()).filter(
        (command) =>
          !command.command.options?.guildId ||
          command.command.options?.guildId.length < 1,
      );
    return this.commands;
  }

  static async getGuildCommands<T extends boolean>(
    sorted: T = true as T,
  ): Promise<T extends true ? { [x: string]: CommandInfo[] } : CommandInfo[]> {
    if (this.guildCommands.length < 1)
      this.guildCommands = (await this.getAllCommands()).filter(
        (command) =>
          command.command.options?.guildId &&
          command.command.options?.guildId.length > 0,
      );
    if (Object.keys(this.guildCommandsSorted).length < 1)
      for (const command of this.guildCommands)
        for (const guildId of command.command.options?.guildId || [])
          if (!this.guildCommandsSorted[guildId])
            this.guildCommandsSorted[guildId] = [command];
          else this.guildCommandsSorted[guildId].push(command);
    return (
      sorted ? this.guildCommandsSorted : this.guildCommands
    ) as T extends true ? { [x: string]: CommandInfo[] } : CommandInfo[];
  }

  private static getCommandLocalization(
    command: CommandType,
    commandName: string,
    nameArg: number,
  ) {
    const name = Array.isArray(command.name) ? command.name : [command.name];
    const nameLocalization = command.localization?.name
      ? Array.isArray(command.localization.name)
        ? command.localization.name
        : [command.localization.name]
      : [];
    let descriptionLocalization = command.localization?.description
      ? Array.isArray(command.localization.description)
        ? command.localization.description
        : [command.localization.description]
      : [];
    if (nameLocalization.length == 0 && descriptionLocalization.length == 0)
      return null;
    if (name.length != nameLocalization.length)
      throw new Error(
        `The number of names and localization names is different.\nCommand Name : '${name[0]}'`,
      );
    if (nameLocalization.length > 1 && descriptionLocalization.length == 1)
      descriptionLocalization = Array(nameLocalization.length).fill(
        descriptionLocalization[0],
      );
    if (nameLocalization.length != descriptionLocalization.length)
      throw new Error(
        `The number of localization names and localization descriptions is different.\nCommand Name : '${name[0]}'`,
      );
    const result: Partial<
      Record<
        'name_localizations' | 'description_localizations',
        LocalizationMap
      >
    > = {};
    const nameIdx = name.findIndex((v) => v.split(' ')[nameArg] == commandName);
    if (nameIdx < 0) return null;
    Object.keys(nameLocalization[nameIdx]).forEach((key) => {
      if (!result.name_localizations) result.name_localizations = {};
      result.name_localizations[key] =
        nameLocalization[nameIdx][key].split(' ')[nameArg];
      if (nameLocalization[nameIdx][key].split(' ').length - 1 == nameArg) {
        if (!result.description_localizations)
          result.description_localizations = {};
        result.description_localizations[key] =
          descriptionLocalization[nameIdx][key];
      }
    });
    return result;
  }

  private static convertCommand(
    command: CommandInfo,
    commandName: string,
    nameArg: number,
  ): Omit<APIApplicationCommandSubcommandOption, 'type'> {
    const name = Array.isArray(command.command.name)
      ? command.command.name
      : [command.command.name];
    let description = command.command.description
      ? Array.isArray(command.command.description)
        ? command.command.description
        : [command.command.description]
      : [];
    if (name.length > 1 && description.length == 1)
      description = Array(name.length).fill(description[0]);
    if (name.length != description.length)
      throw new Error(
        `The number of names and descriptions is different.\nCommand Name : '${name[0]}'`,
      );
    const descriptionIdx = name.findIndex(
      (v) => v.split(' ')[nameArg] == commandName,
    );
    if (descriptionIdx < 0)
      throw new Error(
        `Command Name is not valid.\nCommand Name : '${name[0]}', Search Name : '${commandName}'`,
      );
    return {
      ...(command.command.command
        ? typeof command.command.command == 'function'
          ? command.command
              .command(
                new SlashCommandSubcommandBuilder()
                  .setName('temp')
                  .setDescription('temp'),
              )
              .toJSON()
          : command.command.command
        : null),
      name: name[descriptionIdx].split(' ')[nameArg],
      description: description[descriptionIdx],
      ...this.getCommandLocalization(command.command, commandName, nameArg),
    };
  }

  private static convertAllCommands(
    commands: CommandInfo[],
  ): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    const result: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    for (const command of commands)
      for (const name of (Array.isArray(command.command.name)
        ? command.command.name
        : [command.command.name]
      ).sort((a, b) => b.split(' ').length - a.split(' ').length)) {
        const nameArg = name.split(' ');

        // Check if the command name is valid
        if (
          commands.some((v) =>
            (Array.isArray(v.command.name)
              ? v.command.name
              : [v.command.name]
            ).some((w) => w == nameArg.slice(0, -1).join(' ')),
          )
        )
          throw new Error(
            `A crash occurred in the Slash Command Name.\nCurrent Command : '${name}', Conflict Command : '${nameArg.slice(0, -1).join(' ')}'`,
          );

        // Generating a Slash Command or a Slash Command Group Required to Create Slash Commands
        if (nameArg.length > 1 && !result.find((v) => v.name == nameArg[0]))
          result.push({
            name: nameArg[0],
            description: nameArg[0],
            ...this.getCommandLocalization(command.command, nameArg[0], 0),
            options: [],
          });
        if (
          nameArg.length > 2 &&
          !result.find((v) => v.options?.find((w) => w.name == nameArg[1]))
        )
          result
            .find((v) => v.name == nameArg[0])
            ?.options?.push({
              type: ApplicationCommandOptionType.SubcommandGroup,
              name: nameArg[1],
              description: nameArg[1],
              ...this.getCommandLocalization(command.command, nameArg[1], 1),
              options: [],
            });

        // Create Slash Command
        if (nameArg.length == 1)
          result.push(this.convertCommand(command, nameArg[0], 0));
        else
          (nameArg.length == 2
            ? result.find((v) => v.name == nameArg[0])
            : (result
                .find((v) => v.name == nameArg[0])
                ?.options?.find(
                  (w) =>
                    w.name == nameArg[1] &&
                    w.type == ApplicationCommandOptionType.SubcommandGroup,
                ) as APIApplicationCommandSubcommandGroupOption)
          )?.options?.push({
            ...this.convertCommand(
              command,
              nameArg[nameArg.length - 1],
              nameArg.length - 1,
            ),
            type: ApplicationCommandOptionType.Subcommand,
          });
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
        Log.debug(
          `Added ${chalk.green(name)} Command (Location : ${chalk.yellow(path)})`,
        );

    for (const { path, command } of Object.keys(guildCommands)
      .map((v) => guildCommands[v])
      .flat())
      for (const name of Array.isArray(command.name)
        ? command.name
        : [command.name])
        for (const guild_id of command.options?.guildId || [])
          Log.debug(
            `Added ${chalk.green(name)} Command for ${chalk.blue(guild_id)} Guild (Location : ${chalk.yellow(path)})`,
          );
  }

  static async registerCommand(other_commands?: any[]) {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const command = this.convertAllCommands(await this.getCommands());
    await rest.put(Routes.applicationCommands(await DiscordUtil.clientId()), {
      body: [...command, ...(other_commands || [])],
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
      if (guildCommands[key])
        list[key].push(this.convertAllCommands(guildCommands[key]));
      if (other_commands && other_commands[key])
        list[key].push(other_commands[key]);
    }

    for (const [guild_id, body] of Object.entries(list))
      await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
        body,
      });
  }
}
