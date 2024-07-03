import {
  Client,
  ContextMenuCommandBuilder,
  ContextMenuCommandType,
  REST,
  Routes,
} from 'discord.js';
import { ExtendedInteraction } from './command';
import { glob } from 'glob';
import { getClientID } from './client';

interface RunOptions {
  client: Client;
  interaction: ExtendedInteraction;
}

export interface MenuType {
  name: string[];
  type: ContextMenuCommandType;
  guildId?: string[];
  run: (options: RunOptions) => any;
}

export class ExtendedMenu {
  constructor(menuOptions: MenuType) {
    Object.assign(this, menuOptions);
  }
}

export class Menu {
  static async getMenus() {
    const result: { path: string; menu: MenuType }[] = [];
    const menus = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../menu/**/*{.ts,.js}`,
    );
    for (const path of menus)
      result.push({ path, menu: (await import(path))?.default });
    return result;
  }

  static async registerMenus() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await getClientID();
    const menus = (await this.getMenus()).filter(
      (v) => !v.menu.guildId || v.menu.guildId.length < 1,
    );

    await rest.put(Routes.applicationCommands(client_id), {
      body: [
        ...((await rest.get(Routes.applicationCommands(client_id))) as any),
        ...menus
          .map((v) =>
            v.menu.name.map((name) =>
              new ContextMenuCommandBuilder()
                .setName(name)
                .setType(v.menu.type)
                .toJSON(),
            ),
          )
          .reduce((a, b) => a.concat(b), []),
      ],
    });

    return menus;
  }

  static async registerGuildMenus() {
    if (!process.env.BOT_TOKEN) throw new Error('No Token Provided');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const client_id = await getClientID();
    const menus = (await this.getMenus()).filter(
      (v) => v.menu.guildId && v.menu.guildId.length > 1,
    );
    const guildMenu: { [x: string]: MenuType[] } = {};

    for (const menu of menus)
      for (const guild_id of menu.menu.guildId!) {
        if (!guildMenu[guild_id]) guildMenu[guild_id] = [];
        guildMenu[guild_id].push(menu.menu);
      }

    for (const [key, value] of Object.entries(guildMenu))
      await rest.put(Routes.applicationGuildCommands(client_id, key), {
        body: [
          ...((await rest.get(
            Routes.applicationGuildCommands(client_id, key),
          )) as any),
          ...value
            .map((v) =>
              v.name.map((name) =>
                new ContextMenuCommandBuilder()
                  .setName(name)
                  .setType(v.type)
                  .toJSON(),
              ),
            )
            .reduce((a, b) => a.concat(b), []),
        ],
      });

    return menus;
  }
}
