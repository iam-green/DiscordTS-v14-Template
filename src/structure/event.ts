import { ClientEvents } from 'discord.js';
import { glob } from 'glob';
import { Log } from '../module';
import { ExtendedClient } from './client';
import chalk from 'chalk';

export type EventType<Key extends keyof ClientEvents> = {
  event: Key;
  once?: boolean;
  run: (client: ExtendedClient, ...args: ClientEvents[Key]) => void;
};

export class ExtendedEvent<Key extends keyof ClientEvents> {
  public static list = new Map<
    string,
    {
      path: string;
      event: EventType<keyof ClientEvents>;
    }
  >();

  constructor(eventOptions: EventType<Key>) {
    Object.assign(this, eventOptions);
  }

  static async init() {
    if (this.list.size < 1) {
      const events = glob.sync(
        `${__dirname.replace(/\\/g, '/')}/../event/**/*{.ts,.js}`,
      );
      for (const path of events)
        if ((await import(path))?.default instanceof ExtendedEvent)
          this.list.set(path, { path, event: (await import(path)).default });
    }
    return this.list;
  }

  static async logEvents() {
    for (const { path, event } of this.list.values())
      Log.debug(
        `Added ${chalk.green(event.event)} Event (Location : ${chalk.yellow(path)})`,
      );
  }
}
