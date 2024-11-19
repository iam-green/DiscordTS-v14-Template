import { ClusterManager } from 'discord-hybrid-sharding';
import { ClusterConfig } from '../config';

export class Cluster {
  static manager?: ClusterManager;

  static async spawn() {
    this.manager = new ClusterManager(
      `${__dirname}/../loader/cluster.${process.argv[1].endsWith('.ts') ? 'ts' : 'js'}`,
      {
        token: process.env.BOT_TOKEN,
        ...ClusterConfig,
        ...(process.argv[1].endsWith('.ts') && {
          execArgv: ['-r', 'ts-node/register'],
        }),
      },
    );
    await this.manager.spawn({ timeout: -1 });
  }
}
