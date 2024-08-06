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
import { ClusterClient } from 'discord-hybrid-sharding';
import { KoreanBots } from '../module';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);

  constructor(option: ClientOptions) {
    super(option);
  }

  async start() {
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(
      `${'['.cyan}Cluster ${`#${this.cluster.id}`.green}${']'.cyan} Logged in as ${this.user?.tag.green}!`,
    );
    if (this.cluster.id == 0) {
      await KoreanBots.init();
      setInterval(
        async () => await KoreanBots.update(this.cluster),
        1000 * 60 * 10,
      );
    }
  }

  async registerModules() {
    this.on('shardReady', async (id) => {
      await this.addCommands();
      await this.addMenus();
      await this.addEvents();
      Log.info(
        `${'['.cyan}Cluster ${`#${this.cluster.id}`.green}${']'.cyan} Shard ${`#${id}`.green} is ready!`
          .green,
      );
    });
  }

  async addCommands() {
    const commands = await Command.getAllCommands();
    this.on(Events.InteractionCreate, (interaction) => {
      if (
        !interaction ||
        !interaction.isCommand() ||
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
      const command = commands.find((v) => v.command.name.includes(name));
      if (command?.command)
        try {
          command.command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client: this,
            interaction: interaction as ExtendedInteraction,
          });
        } catch (e) {
          Log.error(e, command.path);
        }
    });
  }

  async addMenus() {
    const menus = await Menu.getAllMenus();
    this.on(Events.InteractionCreate, (interaction) => {
      if (!interaction || !interaction.isContextMenuCommand()) return;
      const menu = menus.find((v) =>
        v.menu.name.includes(interaction.commandName),
      );
      if (menu)
        try {
          menu.menu.run({
            client: this,
            interaction: interaction as ExtendedInteraction,
          });
        } catch (e) {
          Log.error(e, menu.path);
        }
    });
  }

  async addEvents() {
    for (const event of await Event.getEvents())
      this.on(event.event.event, (...args) => {
        try {
          event.event.run(...args);
        } catch (e) {
          Log.error(e, event.path);
        }
      });
  }
}
