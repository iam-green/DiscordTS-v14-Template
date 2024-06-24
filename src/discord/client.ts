import {
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  Events,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { CommandType, ExtendedEvent, ExtendedInteraction } from '.';
import { Log } from '../module/log';
import { glob } from 'glob';
import 'colors';

export class ExtendedClient extends Client {
  commands: Map<string, CommandType> = new Map();
  guildCommands: Map<string, object[]> = new Map();
  shardId: number | undefined;

  constructor(option: ClientOptions) {
    super(option);
    this.shardId = this.shard?.ids[0];
  }

  async start() {
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
  }

  async registerModules() {
    await this.addEvents();
    await this.addCommands();
    this.on(Events.InteractionCreate, (interaction) => {
      if (interaction.isCommand()) {
        const command = this.commands.get(interaction.commandName);
        if (command)
          command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client: this,
            interaction: interaction as ExtendedInteraction,
          });
      }
    });
    this.on(Events.ClientReady, async () => await this.registerCommands());
  }

  async importFile(path: string) {
    return (await import(path))?.default;
  }

  async addCommands() {
    const commandList = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../command/**/*{.ts,.js}`,
    );
    for (const path of commandList) {
      const command: CommandType = await this.importFile(path);
      if (!command.command) return;
      for (const name of command.name) {
        this.commands.set(name, { ...command, _name: name });
        if (this.shardId != undefined)
          Log.debug(
            `Added ${name.green} from Shard ${`#${this.shardId}`.green} Command (Location : ${path.yellow})`,
          );
      }
    }
  }

  async registerCommands() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    if (!this.application) throw new Error('No Application Provided');
    this.rest.setToken(process.env.BOT_TOKEN);
    const commandList = Array.from(this.commands.values());
    const guilds = Array.from(this.guilds.cache.values());
    for (const guild of guilds) {
      const fetch = await guild.commands.fetch();
      if (fetch.size > 0)
        await this.rest.put(
          Routes.applicationGuildCommands(
            this.application.id,
            guild.id.toString(),
          ),
          { body: [] },
        );
    }
    commandList.map((v) => {
      v.guildId?.forEach((id) => {
        if (!this.guildCommands.get(id)) this.guildCommands.set(id, []);
        for (const name of v.name) {
          const slashCommand = new SlashCommandBuilder().setName(name);
          this.guildCommands.get(id)?.push(v.command(slashCommand).toJSON());
        }
      });
    });
    for (const id of this.guildCommands.keys()) {
      if (this.shardId != undefined)
        Log.debug(`Registering Commands to ${id.green}`);
      await this.rest.put(
        Routes.applicationGuildCommands(this.application.id, id),
        { body: this.guildCommands.get(id) },
      );
    }
    await this.rest.put(Routes.applicationCommands(this.application.id), {
      body: commandList
        .filter((v) => !v.guildId || v.guildId.length < 1)
        .map((v) =>
          v.command(new SlashCommandBuilder().setName(v._name || '')).toJSON(),
        ),
    });
  }

  async addEvents() {
    const events = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../event/**/*{.ts,.js}`,
    );
    for (const path of events) {
      const event: ExtendedEvent<any> = await this.importFile(path);
      if (this.shardId != undefined)
        Log.debug(
          `Added ${event.event.green} from Shard ${`#${this.shardId}`.green} Event (Location : ${path.yellow})`,
        );
      this.on(event.event, event.run);
    }
  }
}
