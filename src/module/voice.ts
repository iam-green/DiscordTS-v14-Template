import { Guild, VoiceState } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  getVoiceConnection,
} from '@discordjs/voice';
import { VoiceInfo, VoiceQueueInfo } from '../types';
import { Log } from './log';

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

  static async join(guild: Guild, voice: VoiceState) {
    if (!getVoiceConnection(guild.id)) this.removeInfo(guild.id);
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
      voiceStatus: { attempt: 1, restarting: false },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  static async subscribe(voice: VoiceInfo, option: VoiceQueueInfo) {
    voice.resource = createAudioResource(await voice.queue[0].voice(), {
      inlineVolume: true,
    });
    voice.resource.volume?.setVolume(
      (option.volume || 1) * (voice.volume || 1),
    );
    voice.player?.play(voice.resource);
    (voice.connection as any).setMaxListeners(0);
    if (voice.player) voice.connection.subscribe(voice.player);
  }

  static async play(guild: Guild, option: VoiceQueueInfo) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;

    voice.queue.push(option);
    if (voice.queue.length != 1) return;

    if (!voice.player)
      voice.player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });
    (voice.player as any).setMaxListeners(0);
    this.subscribe(voice, option);

    voice.player?.on('error', async (e) => {
      if (voice.voiceStatus.restarting) return;
      voice.voiceStatus.restarting = true;
      Log.warn(
        `AudioPlayer error occured, attempt: ${voice.voiceStatus.attempt++}`
          .red,
      );
      if (voice.voiceStatus.attempt > 5) throw e;
      voice.voiceStatus.restarting = false;
      return await this.subscribe(voice, option);
    });

    voice.player?.on(AudioPlayerStatus.Idle, async () => {
      if (voice.voiceStatus.restarting) return;
      voice.voiceStatus.attempt = 1;
      if (voice.adding) return;
      voice.adding = true;
      await (() => new Promise((resolve) => setTimeout(resolve)))();
      if (voice.repeat) voice.queue.push(voice.queue[0]);
      voice.queue.shift();
      voice.queue.sort(
        (a, b) => +(a.date || new Date(0)) - +(b.date || new Date(0)),
      );
      if (voice.queue.length > 0) this.subscribe(voice, option);
      voice.adding = false;
    });
  }

  static skip(guild: Guild, count: number = 1) {
    const voice = this.findInfo(guild?.id);
    if (!voice) return;
    const queue = voice.queue.splice(
      0,
      (count > voice.queue.length ? voice.queue.length : count) - 1,
    );
    if (voice.repeat) voice.queue.push(...queue);
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
    const voice = this.findInfo(guild.id);
    if (!voice) return;
    voice.queue = [];
    voice.player?.stop();
    const connection = getVoiceConnection(guild.id);
    if (connection) connection.destroy();
    this.removeInfo(guild.id);
  }
}
