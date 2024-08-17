import { Events } from 'discord.js';
import { ExtendedEvent } from '../discord';
import { getVoiceConnection } from '@discordjs/voice';
import { Voice } from '../module';

export default new ExtendedEvent({
  event: Events.VoiceStateUpdate,
  run: async (_, oldState, newState) => {
    // Check if the bot is connected to the voice channel
    if (
      getVoiceConnection(oldState.guild.id)?.joinConfig.channelId !=
      (oldState.channel?.id || newState.channel?.id || '')
    )
      return;

    // Check if the bot is the only one in the voice channel or the bot has left the voice channel
    if (
      oldState.channel?.members.filter((v) => !v.user.bot).size == 0 ||
      (!!oldState.channel?.id && !newState.channel?.id)
    )
      Voice.quit(oldState.guild);
  },
});
