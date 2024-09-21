import { ClientEvents } from 'discord.js';
import { glob } from 'glob';
import { Log } from '../../module';
import { ExtendedClient } from './client';
import chalk from 'chalk';

export type EventInfo<Key extends keyof ClientEvents> = {
  path: string;
  event: EventType<Key>;
};

export type EventType<Key extends keyof ClientEvents> = {
  event: Key;
  once?: boolean;
  run: (client: ExtendedClient, ...args: ClientEvents[Key]) => void;
};

export class ExtendedEvent<Key extends keyof ClientEvents> {
  constructor(eventOptions: EventType<Key>) {
    Object.assign(this, eventOptions);
  }

  static async getEvents() {
    const result: { path: string; event: EventType<keyof ClientEvents> }[] = [];
    const events = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../../event/**/*{.ts,.js}`,
    );
    for (const path of events)
      if ((await import(path))?.default instanceof ExtendedEvent)
        result.push({ path, event: (await import(path)).default });
    return result;
  }

  static async logEvents() {
    for (const { path, event } of await this.getEvents())
      Log.debug(
        `Added ${chalk.green(event.event)} Event (Location : ${chalk.yellow(path)})`,
      );
  }
}
