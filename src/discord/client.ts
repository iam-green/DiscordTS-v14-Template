import {
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  Events,
} from 'discord.js';
import { Command, CommandType, ExtendedInteraction } from '.';
import { Log } from '../module/log';
import { Event, ExtendedEvent } from './event';

export const getClientID = async () =>
  (
    await (
      await fetch('https://discordapp.com/api/oauth2/applications/@me', {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      })
    ).json()
  ).id as string;

export class ExtendedClient extends Client {
  events: {
    path: string;
    event: ExtendedEvent<any>;
  }[];
  commands: { path: string; command: CommandType }[];
  runMode: string;

  constructor(option: ClientOptions) {
    super(option);
    this.runMode = this.shard
      ? `Shard ${`#${this.shard.ids[0]}`.green}`
      : 'Main';
    (async () => {
      this.events = await Event.getEvents();
      this.commands = await Command.getCommands();
    })();
  }

  async start() {
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(
      `${'['.cyan}${this.runMode}${']'.cyan} Logged in as ${this.user?.tag.green}!`,
    );
  }

  async registerModules() {
    await Command.registerCommands();
    await Command.registerGuildCommands(this.guilds.cache.map((v) => v));
    await this.addCommands();
    await this.addEvents();
  }

  async addCommands() {
    for (const command of this.commands) {
      for (const name of command.command.name)
        Log.debug(
          `${'['.cyan}${this.runMode}${']'.cyan} Added ${name.green} Command (Location : ${command.path.yellow})`,
        );
    }
    this.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isCommand()) return;
      const command = this.commands.find((v) =>
        v.command.name.includes(interaction.commandName),
      )?.command;
      if (command)
        command.run({
          args: interaction.options as CommandInteractionOptionResolver,
          client: this.shard!.client,
          interaction: interaction as ExtendedInteraction,
        });
    });
  }

  async addEvents() {
    for (const event of this.events) {
      Log.debug(
        `${'['.cyan}${this.runMode}${']'.cyan} Added ${event.event.event.green} Event (Location : ${event.path.yellow})`,
      );
      this.on(event.event.event, event.event.run);
    }
  }
}
