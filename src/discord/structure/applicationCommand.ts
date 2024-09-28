import {
  APIApplicationCommand,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AutocompleteInteraction,
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  LocalizationMap,
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  Routes,
  SlashCommandSubcommandBuilder,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import { ExtendedClient } from './client';
import { glob } from 'glob';
import chalk from 'chalk';
import { Log } from '../../module';
import { DiscordUtil, Language } from '../module';

export type AutoCompleteOptions = {
  client: ExtendedClient;
  interaction: AutocompleteInteraction;
  args: AutocompleteInteraction['options'];
};

export type RunOptions<Type extends ApplicationCommandType> = {
  client: ExtendedClient;
  interaction: ExtendedInteraction &
    (Type extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction<CacheType>
      : Type extends ApplicationCommandType.Message
        ? MessageContextMenuCommandInteraction<CacheType>
        : CommandInteraction);
  args: Type extends ApplicationCommandType.ChatInput
    ? CommandInteractionOptionResolver
    : undefined;
};

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export type CommandType<Type extends ApplicationCommandType> = {
  type: Type;
  name: string | string[];
  description?: Type extends ApplicationCommandType.ChatInput
    ? string | string[]
    : undefined;
  localization?: Partial<{
    name: LocalizationMap | LocalizationMap[];
    description: Type extends ApplicationCommandType.ChatInput
      ? LocalizationMap | LocalizationMap[]
      : undefined;
  }>;
  command?: Type extends ApplicationCommandType.ChatInput
    ?
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
          ) => SlashCommandSubcommandBuilder)
    : undefined;
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
  run: (options: RunOptions<Type>) => void;
  autoComplete?: Type extends ApplicationCommandType.ChatInput
    ? (options: AutoCompleteOptions) => void
    : undefined;
};

export type CommandInfo<Type extends ApplicationCommandType> = {
  path: string;
  command: CommandType<Type>;
};

export class ExtendedApplicationCommand<Type extends ApplicationCommandType> {
  constructor(commandOptions: CommandType<Type>) {
    Object.assign(this, commandOptions);
  }

  private static allCommands: CommandInfo<ApplicationCommandType>[] = [];
  private static commands: CommandInfo<ApplicationCommandType>[] = [];
  private static guildCommands: CommandInfo<ApplicationCommandType>[] = [];
  private static guildCommandsSorted: {
    [x: string]: CommandInfo<ApplicationCommandType>[];
  } = {};

  static async getAllCommands() {
    if (this.allCommands.length < 1) {
      const commands = glob.sync(
        ['command', 'context'].map(
          (v) => `${__dirname.replace(/\\/g, '/')}/../../${v}/**/*.{ts,js}`,
        ),
      );
      for (const path of commands)
        if ((await import(path))?.default instanceof ExtendedApplicationCommand)
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
  ): Promise<
    T extends true
      ? { [x: string]: CommandInfo<ApplicationCommandType>[] }
      : CommandInfo<ApplicationCommandType>[]
  > {
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
    ) as T extends true
      ? { [x: string]: CommandInfo<ApplicationCommandType>[] }
      : CommandInfo<ApplicationCommandType>[];
  }

  private static getCommandLocalization<Type extends ApplicationCommandType>(
    type: Type,
    command: CommandType<Type>,
    commandName: string,
    nameArg: Type extends ApplicationCommandType.ChatInput ? number : undefined,
  ): Pick<
    APIApplicationCommand,
    'name_localizations' | 'description_localizations'
  > | null {
    const isChatInput = type == ApplicationCommandType.ChatInput;
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
    if (isChatInput && name.length != nameLocalization.length)
      throw new Error(
        `The number of names and localization names is different.\nCommand Name : '${name[0]}'`,
      );
    if (
      isChatInput &&
      nameLocalization.length > 1 &&
      descriptionLocalization.length == 1
    )
      descriptionLocalization = Array(nameLocalization.length).fill(
        descriptionLocalization[0],
      );
    if (
      isChatInput &&
      nameLocalization.length != descriptionLocalization.length
    )
      throw new Error(
        `The number of localization names and localization descriptions is different.\nCommand Name : '${name[0]}'`,
      );
    const result: Pick<
      APIApplicationCommand,
      'name_localizations' | 'description_localizations'
    > = {};
    const nameIdx = name.findIndex((v) =>
      isChatInput && typeof nameArg == 'number'
        ? v.split(' ')[nameArg]
        : v == commandName,
    );
    if (nameIdx < 0) return null;
    Object.keys(nameLocalization[nameIdx]).forEach((key) => {
      if (!result.name_localizations) result.name_localizations = {};
      result.name_localizations[key] = isChatInput
        ? nameLocalization[nameIdx][key].split(' ')[nameArg]
        : nameLocalization[nameIdx][key];
      if (
        isChatInput &&
        nameLocalization[nameIdx][key].split(' ').length - 1 == nameArg
      ) {
        if (!result.description_localizations)
          result.description_localizations = {};
        result.description_localizations[key] =
          descriptionLocalization[nameIdx][key];
      }
    });
    return result;
  }

  private static convertCommand<Type extends ApplicationCommandType>(
    type: Type,
    command: CommandInfo<Type>,
    commandName: string,
    nameArg: Type extends ApplicationCommandType.ChatInput ? number : undefined,
  ): Type extends ApplicationCommandType.ChatInput
    ? Omit<APIApplicationCommandSubcommandOption, 'type'>
    : RESTPostAPIContextMenuApplicationCommandsJSONBody {
    const isChatInput = type == ApplicationCommandType.ChatInput;
    const name = Array.isArray(command.command.name)
      ? command.command.name
      : [command.command.name];
    let description: string[] = command.command.description
      ? Array.isArray(command.command.description)
        ? command.command.description
        : [command.command.description]
      : [];
    if (isChatInput && name.length > 1 && description.length == 1)
      description = Array(name.length).fill(description[0]);
    if (isChatInput && name.length != description.length)
      throw new Error(
        `The number of names and descriptions is different.\nCommand Name : '${name[0]}'`,
      );
    const idx = name.findIndex((v) =>
      isChatInput && nameArg ? v.split(' ')[nameArg] : v == commandName,
    );
    if (isChatInput && idx < 0)
      throw new Error(
        `Command Name is not valid.\nCommand Name : '${name[0]}', Search Name : '${commandName}'`,
      );
    return {
      type,
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
      name:
        isChatInput && typeof nameArg == 'number'
          ? name[idx].split(' ')[nameArg]
          : name[idx],
      description: isChatInput ? description[idx] : undefined,
      ...this.getCommandLocalization(
        command.command.type,
        command.command,
        commandName,
        nameArg,
      ),
      ...(!isChatInput && {
        description_localizations: undefined,
      }),
    } as any;
  }

  private static convertAllCommands(
    commands: CommandInfo<ApplicationCommandType>[],
  ): Array<
    | RESTPostAPIChatInputApplicationCommandsJSONBody
    | RESTPostAPIContextMenuApplicationCommandsJSONBody
  > {
    const result: Array<
      | RESTPostAPIChatInputApplicationCommandsJSONBody
      | RESTPostAPIContextMenuApplicationCommandsJSONBody
    > = [];
    for (const command of commands)
      for (const name of (Array.isArray(command.command.name)
        ? command.command.name
        : [command.command.name]
      ).sort((a, b) => b.split(' ').length - a.split(' ').length)) {
        const nameArg = name.split(' ');

        // Check if the command name is valid
        if (
          commands.some(
            (v) =>
              v.command.type == ApplicationCommandType.ChatInput &&
              (Array.isArray(v.command.name)
                ? v.command.name
                : [v.command.name]
              ).some((w) => w == nameArg.slice(0, -1).join(' ')),
          )
        )
          throw new Error(
            `A crash occurred in the Application Command Name.\nCurrent Command : '${name}', Conflict Command : '${nameArg.slice(0, -1).join(' ')}'`,
          );

        // Generating a Application Command or a Application Command Group Required to Create Application Commands
        if (
          command.command.type == ApplicationCommandType.ChatInput &&
          nameArg.length > 1 &&
          !result.find((v) => v.name == nameArg[0])
        )
          result.push({
            name: nameArg[0],
            description: Language.get(
              'en-US',
              'SubCommand_Description',
              nameArg[0],
            ),
            ...this.getCommandLocalization(
              command.command.type,
              command.command,
              nameArg[0],
              0,
            ),
            description_localizations: Language.locales(false)
              .map((v) => ({
                [v]: Language.get(v, 'SubCommand_Description', nameArg[0]),
              }))
              .reduce((a, b) => ({ ...a, ...b })),
            options: [],
          });
        if (
          command.command.type == ApplicationCommandType.ChatInput &&
          nameArg.length > 2 &&
          !result.find((v) => v.options?.find((w) => w.name == nameArg[1]))
        )
          result
            .find((v) => v.name == nameArg[0])
            ?.options?.push({
              type: ApplicationCommandOptionType.SubcommandGroup,
              name: nameArg[1],
              description: Language.get(
                'en-US',
                'SubCommandGroup_Description',
                nameArg[0],
                nameArg[1],
              ),
              ...this.getCommandLocalization(
                command.command.type,
                command.command,
                nameArg[1],
                1,
              ),
              description_localizations: Language.locales(false)
                .map((v) => ({
                  [v]: Language.get(
                    v,
                    'SubCommandGroup_Description',
                    nameArg[0],
                    nameArg[1],
                  ),
                }))
                .reduce((a, b) => ({ ...a, ...b })),
              options: [],
            });

        // Create Application Command
        if (
          nameArg.length == 1 ||
          command.command.type != ApplicationCommandType.ChatInput
        )
          result.push(
            this.convertCommand(
              command.command.type,
              command,
              command.command.type == ApplicationCommandType.ChatInput
                ? nameArg[0]
                : nameArg.join(' '),
              command.command.type == ApplicationCommandType.ChatInput
                ? 0
                : undefined,
            ),
          );
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
              command.command.type,
              command,
              nameArg[nameArg.length - 1],
              nameArg.length - 1,
            ),
            type: ApplicationCommandOptionType.Subcommand,
          } as APIApplicationCommandSubcommandOption);
      }

    return result;
  }

  static async logCommands() {
    const commands = await this.getCommands();
    const guildCommands = (await this.getGuildCommands(true)) as {
      [x: string]: CommandInfo<ApplicationCommandType>[];
    };
    for (const { path, command } of commands)
      for (const name of Array.isArray(command.name)
        ? command.name
        : [command.name])
        Log.debug(
          `Added ${chalk.green(name)} ${
            command.type == ApplicationCommandType.ChatInput
              ? 'Command'
              : 'Context'
          } (Location : ${chalk.yellow(path)})`,
        );

    for (const { path, command } of Object.keys(guildCommands)
      .map((v) => guildCommands[v])
      .flat())
      for (const name of Array.isArray(command.name)
        ? command.name
        : [command.name])
        for (const guild_id of command.options?.guildId || [])
          Log.debug(
            `Added ${chalk.green(name)} ${
              command.type == ApplicationCommandType.ChatInput
                ? 'Command'
                : 'Context'
            } for ${chalk.blue(guild_id)} Guild (Location : ${chalk.yellow(path)})`,
          );
  }

  static async registerCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const command = this.convertAllCommands(await this.getCommands());
    await rest.put(Routes.applicationCommands(await DiscordUtil.clientId()), {
      body: command,
    });
  }

  static async registerGuildCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await DiscordUtil.clientId();
    for (const [guild_id, body] of Object.entries(
      await this.getGuildCommands(true),
    ))
      await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
        body,
      });
  }
}
