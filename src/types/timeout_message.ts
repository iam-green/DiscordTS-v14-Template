import { Message } from 'discord.js';

export interface TimeoutMessageInfo {
  message: Message;
  timeout: NodeJS.Timeout;
}
