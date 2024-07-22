import { Koreanbots } from 'koreanbots';
import { Log } from './log';
import { Cluster, DiscordUtil } from '../discord';

export class KoreanBots {
  static bot?: Koreanbots;

  static async init() {
    if (!process.env.KOREANBOTS_TOKEN) return;
    this.bot = new Koreanbots({
      api: { token: process.env.KOREANBOTS_TOKEN },
      clientID: await DiscordUtil.clientId(),
    });
  }

  static async update() {
    try {
      if (!process.env.KOREANBOTS_TOKEN) return;
      const servers = (
        (await Cluster.manager?.fetchClientValues(
          'guilds.cache.size',
        )) as number[]
      ).reduce((a, b) => a + b, 0);
      await this.bot?.mybot.update({
        servers,
        shards: Cluster.manager?.totalShards,
      });
    } catch (e) {
      Log.error(e, __filename);
    }
  }
}
