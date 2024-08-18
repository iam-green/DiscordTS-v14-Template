import { ClusterManager } from 'discord-hybrid-sharding';
import 'dotenv/config';

export class Cluster {
  static manager?: ClusterManager;

  static async spawn() {
    this.manager = new ClusterManager(
      `${__dirname}/../start.${process.argv[1].endsWith('.ts') ? 'ts' : 'js'}`,
      {
        token: process.env.BOT_TOKEN,
        shardsPerClusters: 4,
        totalShards: 'auto',
        mode: 'process',
        respawn: true,
        restarts: {
          max: 6,
          interval: 1000 * 60 * 60,
        },
        ...(process.argv[1].endsWith('.ts') && {
          execArgv: ['-r', 'ts-node/register'],
        }),
      },
    );
    await this.manager.spawn({ timeout: -1 });
  }
}
