import {
  APIApplicationCommand,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
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
import { Log, Discord } from '../module';
import { Language } from './language';
import { BotConfig } from '../config';

export type AutoCompleteOptions = {
  client: ExtendedClient;
  interaction: AutocompleteInteraction;
  args: AutocompleteInteraction['options'];
};

export type RunOptions<Type extends ApplicationCommandType> = {
  client: ExtendedClient;
  interaction: Type extends ApplicationCommandType.User
    ? UserContextMenuCommandInteraction<CacheType>
    : Type extends ApplicationCommandType.Message
      ? MessageContextMenuCommandInteraction<CacheType>
      : ChatInputCommandInteraction<CacheType>;
  args: Type extends ApplicationCommandType.ChatInput
    ? CommandInteractionOptionResolver
    : undefined;
};

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

export type CommandInfoMap = Map<string, CommandInfo<ApplicationCommandType>>;

export class ExtendedApplicationCommand<Type extends ApplicationCommandType> {
  constructor(commandOptions: CommandType<Type>) {
    Object.assign(this, commandOptions);
  }

  public static allCommands: CommandInfoMap = new Map();
  public static commands: CommandInfoMap = new Map();
  public static guildCommands: CommandInfoMap = new Map();
  public static guildCommandsSorted: Map<string, CommandInfoMap> = new Map();

  static async init() {
    const commands = glob.sync(
      ['command', 'context'].map(
        (v) => `${__dirname.replace(/\\/g, '/')}/../${v}/**/*.{ts,js}`,
      ),
    );
    for (const path of commands)
      if ((await import(path))?.default instanceof ExtendedApplicationCommand) {
        const command = (await import(path)).default;
        this.allCommands.set(command.name, { path, command });
        if (!command.options?.guildId || command.options?.guildId.length < 1)
          this.commands.set(command.name, { path, command });
        else
          for (const guildId of command.options?.guildId) {
            if (!this.guildCommandsSorted.has(guildId))
              this.guildCommandsSorted.set(guildId, new Map());
            this.guildCommandsSorted
              .get(guildId)
              ?.set(command.name, { path, command });
            this.guildCommands.set(command.name, { path, command });
          }
      }
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
    commands: CommandInfoMap,
  ): Array<
    | RESTPostAPIChatInputApplicationCommandsJSONBody
    | RESTPostAPIContextMenuApplicationCommandsJSONBody
  > {
    const result: Array<
      | RESTPostAPIChatInputApplicationCommandsJSONBody
      | RESTPostAPIContextMenuApplicationCommandsJSONBody
    > = [];

    for (const command of commands.values())
      for (const name of (Array.isArray(command.command.name)
        ? command.command.name
        : [command.command.name]
      ).sort((a, b) => b.split(' ').length - a.split(' ').length)) {
        const nameArg = name.split(' ');

        // Check if the command name is valid
        for (const { command: cmd } of commands.values())
          if (
            cmd.type == ApplicationCommandType.ChatInput &&
            (Array.isArray(cmd.name) ? cmd.name : [cmd.name]).some(
              (w) => w == nameArg.slice(0, -1).join(' '),
            )
          )
            throw new Error(
              `A crash occurred in the Application Command Name.\nCurrent Command : '${name}', Conflict Command : '${nameArg.slice(0, -1).join(' ')}'`,
            );

        // Generating an Application Command or an Application Command Group Required to Create Application Commands
        if (
          command.command.type == ApplicationCommandType.ChatInput &&
          nameArg.length > 1 &&
          !result.find((v) => v.name == nameArg[0])
        )
          result.push({
            name: nameArg[0],
            description: Language.get(
              BotConfig.DEFAULT_LANGUAGE,
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
                BotConfig.DEFAULT_LANGUAGE,
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
    for (const { path, command } of this.commands.values())
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

    for (const commands of this.guildCommandsSorted.values())
      for (const { path, command } of commands.values())
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
    const command = this.convertAllCommands(this.commands);
    await rest.put(Routes.applicationCommands(await Discord.clientId()), {
      body: command,
    });
  }

  static async registerGuildCommand() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await Discord.clientId();
    for (const [guild_id, body] of this.guildCommandsSorted)
      await rest.put(Routes.applicationGuildCommands(client_id, guild_id), {
        body: Object.fromEntries(body),
      });
  }
}
