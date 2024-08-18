import { Events } from 'discord.js';
import { ExtendedEvent } from '../discord';
import { Voice } from '../module';

export default new ExtendedEvent({
  event: Events.VoiceStateUpdate,
  run: async (client, oldState, newState) => {
    // Check if the bot has changed the voice channel
    if (
      oldState.member?.id == client.user?.id &&
      oldState.member?.id == newState.member?.id &&
      oldState.channel != newState.channel
    )
      return Voice.join(oldState.guild, newState);

    // Check if the bot is the only one in the voice channel or the bot has left the voice channel
    if (
      (oldState.channel?.members.has(client.user?.id || '') &&
        oldState.channel?.members.filter((v) => !v.user.bot).size == 0) ||
      (oldState.member?.id == client.user?.id &&
        !!oldState.channel?.id &&
        !newState.channel?.id)
    )
      return Voice.quit(oldState.guild);
  },
});
