import { Message } from 'discord.js';

export class TimeoutMessage {
  static list: Map<Message, NodeJS.Timeout> = new Map();

  static async set(message: Message, timeout: number) {
    this.list.set(
      message,
      setTimeout(async () => {
        if (!message || !message.deletable) return;
        message?.delete().catch(() => {});
        this.list.delete(message);
      }, timeout),
    );
  }

  static async clear(message: Message) {
    clearTimeout(this.list.get(message));
    this.list.delete(message);
  }
}
