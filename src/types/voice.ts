import { AudioPlayer, AudioResource } from '@discordjs/voice';
import { Readable } from 'stream';

export interface VoiceOption {
  volume: number;
  repeat: boolean;
  auto_left: boolean;
}

export interface VoiceInfo {
  guild_id: string;
  voice_id: string;
  queue: VoiceQueueInfo[];
  resource?: AudioResource;
  player?: AudioPlayer;
  option?: Partial<VoiceOption>;
  status: {
    adding: boolean;
    voiceAttempt: number;
    voiceRestarting: boolean;
    rejoinRetry: number;
  };
}

export interface VoiceQueueInfo {
  voice: () => string | Readable | Promise<string | Readable>;
  date?: Date;
  volume?: number;
  info?: any;
}
