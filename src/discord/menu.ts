import {
  ContextMenuCommandBuilder,
  ContextMenuCommandType,
  LocalizationMap,
} from 'discord.js';
import { ExtendedInteraction } from './command';
import { glob } from 'glob';
import { Log } from '../module';
import { ExtendedClient } from './client';

interface RunOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
}

export interface MenuType {
  name: string | string[];
  localization?: LocalizationMap | LocalizationMap[];
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
  private static menus?: { path: string; menu: MenuType }[];
  private static guildMenus?: {
    [x: string]: { path: string; menu: MenuType }[];
  };

  static async getAllMenus() {
    const result: { path: string; menu: MenuType }[] = [];
    const menus = glob.sync(
      `${__dirname.replace(/\\/g, '/')}/../menu/**/*{.ts,.js}`,
    );
    for (const path of menus)
      result.push({ path, menu: (await import(path))?.default });
    return result;
  }

  static async getMenus() {
    if (!this.menus)
      this.menus = (await this.getAllMenus()).filter(
        (v) => !v.menu.guildId || v.menu.guildId.length < 1,
      );
    return this.menus;
  }

  static async getGuildMenus() {
    if (!this.guildMenus) {
      const menus = (await this.getAllMenus()).filter(
        (v) => v.menu.guildId && v.menu.guildId.length > 1,
      );
      this.guildMenus = {};
      for (const menu of menus)
        for (const guild_id of menu.menu.guildId || []) {
          if (!this.guildMenus[guild_id]) this.guildMenus[guild_id] = [];
          this.guildMenus[guild_id].push(menu);
        }
    }
    return this.guildMenus;
  }

  static async getMenuJSON() {
    return (await this.getMenus())
      .map((v) =>
        (Array.isArray(v.menu.name) ? v.menu.name : [v.menu.name]).map(
          (name, i) => {
            const localization = v.menu.localization
              ? Array.isArray(v.menu.localization)
                ? v.menu.localization
                : [v.menu.localization]
              : null;
            const builder = new ContextMenuCommandBuilder()
              .setName(name)
              .setType(v.menu.type);
            if (localization) builder.setNameLocalizations(localization[i]);
            return builder.toJSON();
          },
        ),
      )
      .flat();
  }

  static async getGuildMenuJSON() {
    const guildMenus = await this.getGuildMenus();
    const result: { [x: string]: any[] } = {};
    Object.entries(guildMenus).forEach(
      ([k, v]) =>
        (result[k] = v.map((v) =>
          (Array.isArray(v.menu.name) ? v.menu.name : [v.menu.name]).map(
            (name, i) => {
              const localization = Array.isArray(v.menu.localization)
                ? v.menu.localization[i]
                : v.menu.localization;
              const builder = new ContextMenuCommandBuilder()
                .setName(name)
                .setType(v.menu.type);
              if (localization) builder.setNameLocalizations(localization[i]);
              return builder.toJSON();
            },
          ),
        )),
    );
    return result;
  }

  static async logMenus() {
    for (const { path, menu } of await this.getMenus())
      for (const name of Array.isArray(menu.name) ? menu.name : [menu.name])
        Log.debug(
          `Added ${name.green} Context Menu (Location : ${path.yellow})`,
        );

    for (const { path, menu } of Object.values(
      await this.getGuildMenus(),
    ).flat())
      for (const name of Array.isArray(menu.name) ? menu.name : [menu.name])
        for (const guild_id of menu.guildId || [])
          Log.debug(
            `Added ${name.green} Context Menu for ${guild_id.blue} Guild (Location : ${path.yellow})`,
          );
  }
}
