import {
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
  ContextMenuCommandBuilder,
  GuildMember,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { glob } from 'glob';
import { Menu } from './menu';
import { DiscordUtil } from './';

interface RunOptions {
  client: Client;
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

export interface CommandList {
  [x: string]:
    | SlashCommandBuilder
    | {
        [x: string]:
          | SlashCommandSubcommandBuilder
          | { [x: string]: SlashCommandSubcommandBuilder };
      };
}

export class Command {
  static commandToJson(commands: CommandType[]): CommandList {
    const result: CommandList = {};
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

  static jsonToBuilder(list: CommandList): SlashCommandBuilder[] {
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
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const commands = (await this.getCommands()).filter(
      (v) => !v.command.guildId || v.command.guildId.length < 1,
    );
    const menus = (await Menu.getMenus()).filter(
      (v) => !v.menu.guildId || v.menu.guildId.length < 1,
    );

    await rest.put(Routes.applicationCommands(await DiscordUtil.clientId()), {
      body: [
        ...this.jsonToBuilder(
          this.commandToJson(commands.map((v) => v.command)),
        ).map((v) => v.toJSON()),
        ...menus
          .map((v) =>
            v.menu.name.map((name) =>
              new ContextMenuCommandBuilder()
                .setName(name)
                .setType(v.menu.type)
                .toJSON(),
            ),
          )
          .reduce((a, b) => a.concat(b), []),
      ],
    });

    return commands;
  }

  static async registerGuildCommands() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await DiscordUtil.clientId();
    const convertGuildCommand: { [x: string]: CommandList } = {};
    const commands = (await this.getCommands()).filter(
      (v) => v.command.guildId && v.command.guildId.length > 0,
    );
    const menus = (await Menu.getMenus()).filter(
      (v) => v.menu.guildId && v.menu.guildId.length > 1,
    );
    const guildCommand: { [x: string]: CommandType[] } = {};

    for (const command of commands)
      for (const guild_id of command.command.guildId!) {
        if (!guildCommand[guild_id]) guildCommand[guild_id] = [];
        guildCommand[guild_id].push(command.command);
      }

    for (const [key, value] of Object.entries(guildCommand))
      convertGuildCommand[key] = this.commandToJson(value);

    const resultGuildCommand: { [x: string]: SlashCommandBuilder[] } = {};
    for (const [key, value] of Object.entries(convertGuildCommand))
      resultGuildCommand[key] = this.jsonToBuilder(value);

    for (const [key, value] of Object.entries(resultGuildCommand))
      await rest.put(Routes.applicationGuildCommands(client_id, key), {
        body: [
          ...value.map((v) => v.toJSON()),
          ...menus
            .filter((v) => v.menu.guildId?.includes(key))
            .map((v) =>
              v.menu.name.map((name) =>
                new ContextMenuCommandBuilder()
                  .setName(name)
                  .setType(v.menu.type)
                  .toJSON(),
              ),
            )
            .reduce((a, b) => a.concat(b), []),
        ],
      });

    return commands;
  }
}
