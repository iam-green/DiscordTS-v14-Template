import { Client, ClientOptions, LocaleString } from 'discord.js';
import { ClusterClient } from 'discord-hybrid-sharding';
import chalk from 'chalk';
import { Language } from './language';
import { Log } from '../module';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);
  private cooldown: Record<string, Record<string, number>> = {};
  private prefix = `${chalk.cyan('[')}Cluster ${chalk.green(
    `#${this.cluster.id}`,
  )}${chalk.cyan(']')}`;
  locale: Record<string, LocaleString> = {};

  constructor(option: ClientOptions) {
    super(option);
  }

  async start() {
    await Language.init();
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(`${this.prefix} Logged in as ${chalk.green(this.user?.tag)}!`);
  }

  private async registerModules() {
    await this.addAutoComplete();
    await this.addCommands();
    await this.addTextCommands();
    await this.addEvents();
    await this.addComponents();
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
  }

  private async addAutoComplete() {}

  private async addCommands() {}

  private async addTextCommands() {}

  private async addEvents() {}

  private async addComponents() {}
}
