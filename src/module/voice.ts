import { Guild, VoiceState } from 'discord.js';
import { VoiceInfo, VoiceOption, VoiceQueueInfo } from '../types';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { Log } from './log';
import { spawn } from 'child_process';
import { DiscordUtil } from '../discord';

export class Voice {
  static list: VoiceInfo[] = [];

  static urlToStream(url: string) {
    return spawn('ffmpeg', ['-i', url, '-f', 'mp3', '-'], {
      stdio: ['pipe', 'pipe', 'ignore'],
    }).stdout;
  }

  static findInfo(guild: Guild) {
    return this.list.find((v) => v.guild_id == guild.id);
  }

  static removeInfo(guild: Guild) {
    this.list.splice(
      this.list.findIndex((v) => v.guild_id == guild.id),
      1,
    );
  }

  static async checkJoined(guild: Guild) {
    const connection = getVoiceConnection(guild.id);
    const voiceState = guild.members.cache.get(
      await DiscordUtil.clientId(),
    )?.voice;
    if (connection && (!voiceState || !voiceState.channelId)) {
      connection.destroy();
      this.removeInfo(guild);
      return undefined;
    }
    if (!connection && voiceState?.channelId) {
      await voiceState.disconnect();
      this.removeInfo(guild);
      return undefined;
    }
    return this.findInfo(guild);
  }

  static async join(
    guild: Guild,
    voice: VoiceState,
    option?: Partial<VoiceOption>,
  ) {
    if (!voice.channel) return;
    if (this.findInfo(guild)) this.removeInfo(guild);
    joinVoiceChannel({
      channelId: voice.channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    this.list.push({
      guild_id: guild.id,
      voice_id: voice.channel.id,
      queue: [],
      option,
      status: {
        adding: false,
        voiceAttempt: 1,
        voiceRestarting: false,
        rejoinRetry: 0,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  static async subscribe(
    connection: VoiceConnection,
    voice: VoiceInfo,
    option: VoiceQueueInfo,
  ) {
    voice.resource = createAudioResource(await voice.queue[0].voice(), {
      inlineVolume: true,
    });
    voice.resource.volume?.setVolume(
      (option.volume || 1) * (voice.option?.volume || 1),
    );
    voice.player?.play(voice.resource);
    (connection as any).setMaxListeners(0);
    if (voice.player) connection.subscribe(voice.player);
  }

  static async play(guild: Guild, option: VoiceQueueInfo) {
    const connection = getVoiceConnection(guild.id);
    const voice = this.findInfo(guild);
    if (!connection || !voice) return;

    voice.queue.push(option);
    if (voice.queue.length != 1) return;

    if (!voice.player)
      voice.player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });
    (voice.player as any).setMaxListeners(0);
    await this.subscribe(connection, voice, option);

    // Voice Connection Unexpected Disconnection Handling
    connection.on('stateChange', async (_, newState) => {
      if (
        newState.status == VoiceConnectionStatus.Disconnected &&
        newState.reason == VoiceConnectionDisconnectReason.WebSocketClose &&
        ![4006, 4014].includes(newState.closeCode)
      )
        if (voice.status.rejoinRetry < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          connection.rejoin();
          voice.status.rejoinRetry++;
        } else {
          connection.destroy();
          this.quit(guild);
        }
    });

    // Voice Connection Error Handling
    connection.on('error', async () => {
      if (connection.state.status != VoiceConnectionStatus.Destroyed)
        if (voice.status.rejoinRetry < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          connection.rejoin();
          voice.status.rejoinRetry++;
        } else {
          connection.destroy();
          this.quit(guild);
        }
    });

    // Voice Player Error Handling
    voice.player?.on('error', async (e) => {
      if (voice.status.voiceRestarting) return;
      voice.status.voiceRestarting = true;
      Log.warn(
        `AudioPlayer error occured, attempt: ${voice.status.voiceAttempt++}`,
      );
      if (voice.status.voiceAttempt > 3) throw e;
      voice.status.voiceRestarting = false;
      return await this.subscribe(connection, voice, option);
    });

    // Voice Player Idle Handling
    voice.player?.on(AudioPlayerStatus.Idle, async () => {
      if (voice.status.voiceRestarting) return;
      voice.status.voiceAttempt = 1;
      if (voice.status.adding) return;
      voice.status.adding = true;
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (voice.option?.repeat) voice.queue.push(voice.queue[0]);
      voice.queue.shift();
      voice.queue.sort(
        (a, b) => +(a.date || new Date(0)) - +(b.date || new Date(0)),
      );
      if (voice.queue.length > 0)
        await this.subscribe(connection, voice, option);
      voice.status.adding = false;
    });
  }

  static skip(guild: Guild, count: number = 1) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    const queue = voice.queue.splice(
      0,
      (count > voice.queue.length ? voice.queue.length : count) - 1,
    );
    if (voice.option?.repeat) voice.queue.push(...queue);
    voice.player?.stop();
  }

  static shuffle(guild: Guild) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    voice.queue = [
      voice.queue[0],
      ...voice.queue.slice(1).sort(() => Math.random() - 0.5),
    ];
  }

  static repeat(guild: Guild, status: boolean) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    if (!voice.option) voice.option = {};
    voice.option.repeat = status;
  }

  static volume(guild: Guild, volume: number) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    if (!voice.option) voice.option = {};
    voice.option.volume = volume;
    voice.resource?.volume?.setVolume((voice.queue[0].volume || 1) * volume);
  }

  static stop(guild: Guild) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    voice.queue = [];
    voice.player?.stop();
  }

  static quit(guild: Guild) {
    const voice = this.findInfo(guild);
    if (!voice) return;
    voice.player?.stop();
    this.removeInfo(guild);
    getVoiceConnection(guild.id)?.destroy();
  }
}
