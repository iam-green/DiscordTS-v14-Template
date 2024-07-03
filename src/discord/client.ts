import {
  ApplicationCommandType,
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  Events,
  InteractionType,
} from 'discord.js';
import { Command, ExtendedInteraction, Menu } from '.';
import { Log } from '../module/log';
import { Event } from './event';

export const getClientID = async () =>
  (
    await (
      await fetch('https://discordapp.com/api/oauth2/applications/@me', {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      })
    ).json()
  ).id as string;

export const getBotOwner = async () => {
  const data = await (
    await fetch('https://discordapp.com/api/oauth2/applications/@me', {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
    })
  ).json();
  return (data.team.owner_user_id || data.owner.id) as string;
};

export class ExtendedClient extends Client {
  runMode: string;

  constructor(option: ClientOptions) {
    super(option);
    this.runMode = this.shard
      ? `Shard ${`#${this.shard.ids[0]}`.green}`
      : 'Main';
  }

  async start() {
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(
      `${'['.cyan}${this.runMode}${']'.cyan} Logged in as ${this.user?.tag.green}!`,
    );
  }

  async registerModules() {
    await this.addCommands();
    await this.addMenus();
    await this.addEvents();
  }

  async addCommands() {
    const commands = await Command.getCommands();
    this.on(Events.InteractionCreate, (interaction) => {
      if (
        interaction.type != InteractionType.ApplicationCommand ||
        interaction.commandType != ApplicationCommandType.ChatInput
      )
        return;
      const name = [
        interaction.commandName,
        interaction.options.getSubcommandGroup(false),
        interaction.options.getSubcommand(false),
      ]
        .filter((v) => v)
        .join(' ');
      const command = commands.find((v) =>
        v.command.name.includes(name),
      )?.command;
      if (command)
        command.run({
          args: interaction.options as CommandInteractionOptionResolver,
          client: this.shard!.client,
          interaction: interaction as ExtendedInteraction,
        });
    });
  }

  async addMenus() {
    const menus = await Menu.getMenus();
    this.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isContextMenuCommand()) return;
      const menu = menus.find((v) =>
        v.menu.name.includes(interaction.commandName),
      );
      if (menu)
        menu.menu.run({
          client: this,
          interaction: interaction as ExtendedInteraction,
        });
    });
  }

  async addEvents() {
    for (const event of await Event.getEvents())
      this.on(event.event.event, event.event.run);
  }
}
