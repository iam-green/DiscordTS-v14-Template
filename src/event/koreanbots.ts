import { ExtendedEvent } from '../discord';
import { KoreanBots } from '../module';

export default new ExtendedEvent({
  event: 'ready',
  once: true,
  run: async (client) => {
    if (client.cluster.id != 0 || !process.env.KOREANBOTS_TOKEN) return;
    setInterval(() => KoreanBots.update(client.cluster), 1000 * 60 * 10);
  },
});
