import { AudioPlayer, AudioResource, VoiceConnection } from '@discordjs/voice';
import internal from 'stream';

export interface VoiceInfo {
  guild_id: string;
  voice_id: string;
  queue: VoiceQueueInfo[];
  connection: VoiceConnection;
  resource?: AudioResource;
  player?: AudioPlayer;
  volume?: number;
  repeat: boolean;
  adding: boolean;
  voiceStatus: { attempt: number; restarting: boolean };
}

export interface VoiceQueueInfo {
  voice: () => string | internal.Readable | Promise<string | internal.Readable>;
  date?: Date;
  volume?: number;
  info?: any;
}
