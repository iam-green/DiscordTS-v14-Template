import { Koreanbots } from 'koreanbots';
import { client } from '../discord';
import { Log } from './log';

export class KoreanBots {
  static async update() {
    if (!process.env.KOREANBOTS_TOKEN) return;
    const bot = new Koreanbots({
      api: { token: process.env.BOT_TOKEN! },
      clientID: client.application!.id,
    });
    Log.debug('KoreanBots information has been successfully updated.');
    return await bot.mybot.update({
      servers: client.guilds.cache.size,
      shards: client.shard?.count,
    });
  }
}
