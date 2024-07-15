import { AudioPlayer, AudioResource, VoiceConnection } from '@discordjs/voice';

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
  voice: {
    link: string;
    type: 'url' | 'ytdl' | 'soundcloud-downloader';
  };
  volume?: number;
  info?: any;
}
