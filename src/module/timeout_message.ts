import { client } from '../discord';
import { TimeoutMessageInfo } from '../types';

export class TimeoutMessage {
  static list: TimeoutMessageInfo[] = [];

  static async set(channel_id: string, message_id: string, timeout: number) {
    const channel = await client.channels.fetch(channel_id);
    if (!channel?.isTextBased()) return;
    const idx = this.list.findIndex(
      (v) => v.channel_id === channel_id && v.message_id === message_id,
    );
    const data = {
      channel_id,
      message_id,
      timeout: setTimeout(async () => {
        const message = await channel.messages.fetch(message_id);
        if (!message) return;
        message.delete();
        this.list.splice(
          this.list.findIndex(
            (v) => v.channel_id === channel_id && v.message_id === message_id,
          ),
          1,
        );
      }, timeout),
    };
    if (idx == -1) this.list.push(data);
    else {
      clearTimeout(this.list[idx].timeout);
      this.list[idx] = data;
    }
  }

  static async clear(channel_id: string, message_id: string) {
    const idx = this.list.findIndex(
      (v) => v.channel_id === channel_id && v.message_id === message_id,
    );
    if (idx == -1) return;
    clearTimeout(this.list[idx].timeout);
    this.list.splice(idx, 1);
  }
}
