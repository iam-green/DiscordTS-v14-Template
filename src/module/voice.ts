import { Guild, VoiceState } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { VoiceInfo, VoiceQueueInfo } from '../types';

export class Voice {
  static list: VoiceInfo[] = [];

  static findInfo(id?: string) {
    return this.list.find((v) => v.guild_id == id);
  }

  static removeInfo(id?: string) {
    this.list.splice(
      this.list.findIndex((v) => v.guild_id == id),
      1,
    );
  }

  static join(guild: Guild, voice: VoiceState) {
    if (!guild || !voice.channel) return;
    const connection = joinVoiceChannel({
      channelId: voice.channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    this.list.push({
      guild_id: guild.id,
      voice_id: voice.channel.id,
      queue: [],
      connection,
      adding: false,
    });
  }

  static play(guild: Guild, option: VoiceQueueInfo) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    if (!voice.player) voice.player = createAudioPlayer();
    voice.player?.setMaxListeners(0);
    voice.queue.push(option);
    if (voice.queue.length == 1) {
      voice.player.play(createAudioResource(voice.queue[0].url));
      voice.connection.setMaxListeners(0);
      voice.connection.subscribe(voice.player);
      voice.connection.on(VoiceConnectionStatus.Disconnected, async () =>
        this.quit(guild),
      );
      voice.player?.on(AudioPlayerStatus.Idle, async () => {
        if (!voice.adding) {
          voice.adding = true;
          await (() => new Promise((resolve) => setTimeout(resolve)))();
          voice.queue.shift();
          voice.queue.sort((a, b) => +a.date - +b.date);
          if (voice.queue.length > 0)
            voice.player?.play(createAudioResource(voice.queue[0].url));
          voice.adding = false;
        }
      });
    }
  }

  static stop(guild: Guild) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.player?.stop();
    voice.queue = [];
  }

  static quit(guild: Guild) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.connection.destroy();
    this.removeInfo(guild?.id);
  }
}
