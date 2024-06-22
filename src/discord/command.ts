import {
  Client,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';

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
  _name?: string;
};

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export class ExtendedCommand {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}
