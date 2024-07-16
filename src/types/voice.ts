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
}

export interface VoiceQueueInfo {
  voice: () => string | internal.Readable | Promise<string | internal.Readable>;
  volume?: number;
  info?: any;
}
