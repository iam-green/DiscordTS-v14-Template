import { Events } from 'discord.js';
import { Log } from '../module';
import { ExtendedEvent } from '../discord';

export default new ExtendedEvent(Events.MessageCreate, async (message) => {
  Log.info(
    [
      '',
      `Guild ID : ${message.guildId?.green}`,
      `Channel ID : ${message.channelId?.green}`,
      `User ID : ${message.author.id.green}`,
      `Message : ${message.content.green}`,
    ].join('\n\t'),
  );
});
