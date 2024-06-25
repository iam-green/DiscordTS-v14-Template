export interface TimeoutMessageInfo {
  channel_id: string;
  message_id: string;
  timeout: NodeJS.Timeout;
}
