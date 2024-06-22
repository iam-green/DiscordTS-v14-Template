import { AudioPlayer, VoiceConnection } from '@discordjs/voice';

export interface VoiceInfo {
  guild_id: string;
  voice_id: string;
  queue: VoiceQueueInfo[];
  connection: VoiceConnection;
  player?: AudioPlayer;
  adding: boolean;
}

export interface VoiceQueueInfo {
  url: string;
  date: Date;
}
