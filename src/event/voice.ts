import { Events } from 'discord.js';
import { ExtendedEvent } from '../structure';
import { Voice } from '../module';

export default new ExtendedEvent({
  event: Events.VoiceStateUpdate,
  run: async (client, oldState, newState) => {
    const voice = Voice.list.get(oldState.guild.id);

    // Check if the bot has changed the voice channel
    if (
      newState.channel &&
      oldState.member?.id == client.user?.id &&
      oldState.member?.id == newState.member?.id &&
      oldState.channel?.id != newState.channel.id
    )
      return Voice.join(oldState.guild.id, newState.channel.id, voice?.option);

    // Check if the bot is the only one in the voice channel or the bot has left the voice channel
    if (
      (voice?.option?.auto_left &&
        oldState.channel?.members.has(client.user?.id || '') &&
        oldState.channel?.members.filter((v) => !v.user.bot).size == 0) ||
      (oldState.member?.id == client.user?.id &&
        oldState.channel &&
        !newState.channel)
    )
      return Voice.quit(oldState.guild.id);
  },
});
