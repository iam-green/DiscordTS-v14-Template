import { ClientEvents } from 'discord.js';

export class ExtendedEvent<Key extends keyof ClientEvents> {
  constructor(
    public event: Key,
    public run: (...args: ClientEvents[Key]) => any,
  ) {}
}
