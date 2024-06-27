export interface TimeoutMessageInfo {
  guild_id: string;
  channel_id: string;
  message_id: string;
  timeout: NodeJS.Timeout;
}
