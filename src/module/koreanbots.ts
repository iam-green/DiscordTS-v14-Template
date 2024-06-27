import { Koreanbots } from 'koreanbots';
import { Log } from './log';
import { getClientID } from '../discord';
import { ShardingManager } from 'discord.js';

export class KoreanBots {
  static async update(shard: ShardingManager) {
    try {
      if (!process.env.KOREANBOTS_TOKEN) return;
      const servers = (
        (await shard.fetchClientValues('guilds.cache.size')) as number[]
      ).reduce((a, b) => a + b, 0);
      const bot = new Koreanbots({
        api: { token: process.env.KOREANBOTS_TOKEN! },
        clientID: await getClientID(),
      });
      await bot.mybot.update({
        servers,
        shards: shard.shards.size,
      });
    } catch (e) {
      Log.error(e, __filename);
    }
  }
}
