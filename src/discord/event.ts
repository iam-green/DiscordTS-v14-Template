import { ClientEvents } from 'discord.js';
import { glob } from 'glob';

export class ExtendedEvent<Key extends keyof ClientEvents> {
  constructor(
    public event: Key,
    public run: (...args: ClientEvents[Key]) => any,
  ) {}
}

export class Event {
  static async getEvents() {
    const result: { path: string; event: ExtendedEvent<any> }[] = [];
    const events = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../event/**/*{.ts,.js}`,
    );
    for (const path of events)
      result.push({ path, event: (await import(path))?.default });
    return result;
  }
}
