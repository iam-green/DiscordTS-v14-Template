import { Events } from 'discord.js';
import { Log } from '../module';
import { ExtendedEvent } from '../discord';

export default new ExtendedEvent(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  Log.info(
    [
      '',
      `Guild ID : ${message.guildId?.green}`,
      `Channel ID : ${message.channelId?.green}`,
      `User ID : ${message.author.id.green}`,
      `Message : ${message.content.replace(/\n/g, '\n\t').green}`,
    ].join('\n\t'),
  );
});
