import { Client, ClientOptions } from 'discord.js';
import { Log } from '../module/log';
import { ClusterClient } from 'discord-hybrid-sharding';
import chalk from 'chalk';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);
  private prefix = `${chalk.cyan('[')}Cluster ${this.cluster.id}${chalk.cyan(']')}`;

  constructor(option: ClientOptions) {
    super(option);
  }

  async start() {
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
    Log.info(`${this.prefix} Logged in as ${chalk.green(this.user?.tag)}!`);
  }

  async registerModules() {}
}
