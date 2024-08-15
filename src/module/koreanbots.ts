import { Koreanbots } from 'koreanbots';
import { Log } from './log';
import { DiscordUtil, ExtendedClient } from '../discord';
import { ClusterClient, ClusterManager } from 'discord-hybrid-sharding';

export class KoreanBots {
  static bot?: Koreanbots;

  static async init() {
    if (!process.env.KOREANBOTS_TOKEN) return;
    this.bot = new Koreanbots({
      api: { token: process.env.KOREANBOTS_TOKEN },
      clientID: await DiscordUtil.clientId(),
    });
  }

  static async update(cluster: ClusterManager | ClusterClient<ExtendedClient>) {
    try {
      if (!process.env.KOREANBOTS_TOKEN) return;
      const servers = (
        (await cluster?.fetchClientValues('guilds.cache.size')) as number[]
      ).reduce((a, b) => a + b, 0);
      await this.bot?.mybot.update({
        servers,
        shards:
          cluster instanceof ClusterClient
            ? cluster.count
            : cluster.clusters.size,
      });
    } catch (e) {
      Log.error(e, __filename);
    }
  }
}
