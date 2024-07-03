import { Client, ContextMenuCommandType } from 'discord.js';
import { ExtendedInteraction } from './command';
import { glob } from 'glob';

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

  static async getRegisteredMenus() {
    const menus = (await this.getMenus()).filter(
      (v) => !v.menu.guildId || v.menu.guildId.length < 1,
    );
    return menus;
  }

  static async getRegisteredGuildMenus() {
    const menus = (await this.getMenus()).filter(
      (v) => v.menu.guildId && v.menu.guildId.length > 1,
    );
    return menus;
  }
}
