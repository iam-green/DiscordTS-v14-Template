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
      repeat: false,
      adding: false,
    });
  }

  static play(guild: Guild, option: VoiceQueueInfo) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    if (!voice.player) voice.player = createAudioPlayer();
    (voice.player as any).setMaxListeners(0);
    voice.queue.push(option);
    if (voice.queue.length == 1) {
      voice.resource = createAudioResource(voice.queue[0].voice, {
        inlineVolume: true,
      });
      voice.resource.volume?.setVolume(
        (option.volume || 1) * (voice.volume || 1),
      );
      voice.player.play(voice.resource);
      (voice.connection as any).setMaxListeners(0);
      voice.connection.subscribe(voice.player);
      voice.connection.on(VoiceConnectionStatus.Disconnected, async () =>
        this.quit(guild),
      );
      voice.player?.on(AudioPlayerStatus.Idle, async () => {
        if (!voice.adding) {
          voice.adding = true;
          await (() => new Promise((resolve) => setTimeout(resolve)))();
          if (voice.repeat) voice.queue.push(voice.queue[0]);
          voice.queue.shift();
          voice.queue.sort((a, b) => +a.date - +b.date);
          if (voice.queue.length > 0) {
            voice.resource = createAudioResource(voice.queue[0].voice, {
              inlineVolume: true,
            });
            voice.resource.volume?.setVolume(
              (option.volume || 1) * (voice.volume || 1),
            );
            voice.player?.play(voice.resource);
          }
          voice.adding = false;
        }
      });
    }
  }

  static skip(guild: Guild, count: number = 1) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.queue.splice(
      0,
      (count > voice.queue.length ? voice.queue.length : count) - 1,
    );
    voice.player?.stop();
  }

  static shuffle(guild: Guild) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.queue = [
      voice.queue[0],
      ...voice.queue.slice(1).sort(() => Math.random() - 0.5),
    ];
  }

  static repeat(guild: Guild, status: boolean) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.repeat = status;
  }

  static volume(guild: Guild, volume: number) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.volume = volume;
    voice.resource?.volume?.setVolume((voice.queue[0].volume || 1) * volume);
  }

  static stop(guild: Guild) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.queue = [];
    voice.player?.stop();
  }

  static quit(guild: Guild) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    voice.connection.destroy();
    this.removeInfo(guild?.id);
  }
}
