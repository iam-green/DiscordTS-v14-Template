import { Koreanbots } from 'koreanbots';
import { client } from '../discord';
import { Log } from './log';

export class KoreanBots {
  static async update() {
    try {
      if (!process.env.KOREANBOTS_TOKEN) return;
      const bot = new Koreanbots({
        api: { token: process.env.KOREANBOTS_TOKEN! },
        clientID: client.application!.id,
      });
      await bot.mybot.update({
        servers: client.guilds.cache.size,
        shards: client.shard?.count,
      });
    } catch (e) {
      Log.error(e, __filename);
    }
  }
}
