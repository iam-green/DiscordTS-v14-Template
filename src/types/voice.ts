import { AudioPlayer, AudioResource } from '@discordjs/voice';
import { Readable } from 'stream';

export interface VoiceInfo {
  guild_id: string;
  voice_id: string;
  queue: VoiceQueueInfo[];
  resource?: AudioResource;
  player?: AudioPlayer;
  volume?: number;
  repeat: boolean;
  status: {
    adding: boolean;
    voiceAttempt: number;
    voiceRestarting: boolean;
  };
}

export interface VoiceQueueInfo {
  voice: () => string | Readable | Promise<string | Readable>;
  date?: Date;
  volume?: number;
  info?: any;
}
