import { Message } from 'discord.js';

export class TimeoutMessage {
  static list: {
    message: Message;
    timeout: NodeJS.Timeout;
  }[] = [];

  static async set(message: Message, timeout: number) {
    this.list.push({
      message,
      timeout: setTimeout(async () => {
        if (!message || !message.deletable) return;
        message?.delete().catch(() => {});
        this.list.splice(
          this.list.findIndex((v) => v.message.id == message.id),
          1,
        );
      }, timeout),
    });
  }

  static async clear(message: Message) {
    const idx = this.list.findIndex((v) => v.message.id == message.id);
    if (idx == -1) return;
    clearTimeout(this.list[idx].timeout);
    this.list.splice(idx, 1);
  }
}
