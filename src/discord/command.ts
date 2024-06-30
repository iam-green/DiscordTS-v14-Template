import {
  Client,
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
import { getClientID } from './client';

interface RunOptions {
  client: Client;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  name: string[];
  command: (
    builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
  ) => any;
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
    const convertCommand: CommandList = {};
    const commands = (await this.getCommands()).filter(
      (v) => !v.command.guildId || v.command.guildId.length < 1,
    );

    for (const command of commands)
      for (const name of command.command.name) {
        const nameList = name.split(' ');
        if (nameList.length == 1) {
          convertCommand[nameList[0]] = command.command.command(
            new SlashCommandBuilder().setName(nameList[0]),
          );
        } else {
          if (
            !commands.find((v) => v.command.name.includes(nameList[0])) &&
            !convertCommand[nameList[0]]
          )
            convertCommand[nameList[0]] = {};
          if (nameList.length == 2) {
            convertCommand[nameList[0]][nameList[1]] = command.command.command(
              new SlashCommandSubcommandBuilder().setName(nameList[1]),
            );
          } else {
            if (
              !commands.find((v) =>
                v.command.name.includes(`${nameList[0]} ${nameList[1]}`),
              ) &&
              !convertCommand[nameList[0]][nameList[1]]
            )
              convertCommand[nameList[0]][nameList[1]] = {};
            convertCommand[nameList[0]][nameList[1]][nameList[2]] =
              command.command.command(
                new SlashCommandSubcommandBuilder().setName(nameList[2]),
              );
          }
        }
      }

    const resultSlashCommand: SlashCommandBuilder[] = [];
    for (const [key1, value1] of Object.entries(convertCommand))
      if (value1 instanceof SlashCommandBuilder)
        resultSlashCommand.push(value1);
      else {
        const slashCommand = new SlashCommandBuilder()
          .setName(key1)
          .setDescription(`'${key1}'의 서브 명령어`);
        for (const [key2, value2] of Object.entries(value1))
          if (value2 instanceof SlashCommandSubcommandBuilder)
            slashCommand.addSubcommand(value2);
          else {
            const subSlashCommand = new SlashCommandSubcommandGroupBuilder()
              .setName(key2)
              .setDescription(`'${key1} ${key2}' 서브 명령어`);
            for (const value3 of Object.values(value2))
              subSlashCommand.addSubcommand(value3);
            slashCommand.addSubcommandGroup(subSlashCommand);
          }
        resultSlashCommand.push(slashCommand);
      }

    await rest.put(Routes.applicationCommands(await getClientID()), {
      body: resultSlashCommand.map((v) => v.toJSON()),
    });
  }

  static async registerGuildCommands() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const convertGuildCommand: { [x: string]: CommandList } = {};
    const commands = (await this.getCommands()).filter(
      (v) => v.command.guildId && v.command.guildId.length > 0,
    );

    for (const command of commands)
      for (const name of command.command.name)
        for (const guild_id of command.command.guildId!) {
          const nameList = name.split(' ');
          if (nameList.length == 1) {
            convertGuildCommand[guild_id][nameList[0]] =
              command.command.command(
                new SlashCommandBuilder().setName(nameList[0]),
              );
          } else {
            if (
              !commands.find((v) => v.command.name.includes(nameList[0])) ||
              !convertGuildCommand[guild_id][nameList[0]]
            )
              convertGuildCommand[guild_id][nameList[0]] = {};
            if (nameList.length == 2) {
              convertGuildCommand[guild_id][nameList[0]][nameList[1]] =
                command.command.command(
                  new SlashCommandSubcommandBuilder().setName(nameList[1]),
                );
            } else {
              if (
                !commands.find((v) =>
                  v.command.name.includes(`${nameList[0]} ${nameList[1]}`),
                ) ||
                !convertGuildCommand[guild_id][nameList[0]][nameList[1]]
              )
                convertGuildCommand[guild_id][nameList[0]][nameList[1]] = {};
              convertGuildCommand[guild_id][nameList[0]][nameList[1]][
                nameList[2]
              ] = command.command.command(
                new SlashCommandSubcommandBuilder().setName(nameList[2]),
              );
            }
          }
        }

    const resultGuildCommand: { [x: string]: SlashCommandBuilder[] } = {};
    for (const [key, value] of Object.entries(convertGuildCommand))
      for (const [key1, value1] of Object.entries(value))
        if (value1 instanceof SlashCommandBuilder)
          resultGuildCommand[key].push(value1);
        else {
          const slashCommand = new SlashCommandBuilder()
            .setName(key1)
            .setDescription(`'${key1}'의 서브 명령어`);
          for (const [key2, value2] of Object.entries(value1))
            if (value2 instanceof SlashCommandSubcommandBuilder)
              slashCommand.addSubcommand(value2);
            else {
              const subSlashCommand = new SlashCommandSubcommandGroupBuilder()
                .setName(key2)
                .setDescription(`'${key1} ${key2}' 서브 명령어`);
              for (const value3 of Object.values(value2))
                subSlashCommand.addSubcommand(value3);
            }
          resultGuildCommand[key].push(slashCommand);
        }

    for (const [key, value] of Object.entries(resultGuildCommand))
      await rest.put(
        Routes.applicationGuildCommands(await getClientID(), key),
        {
          body: value.map((v) => v.toJSON()),
        },
      );
  }
}
