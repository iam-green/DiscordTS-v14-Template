import {
  ApplicationCommandType,
  Locale,
  LocaleString,
  SharedNameAndDescription,
  SlashCommandStringOption,
} from 'discord.js';
import { glob } from 'glob';
import { BotConfig } from '../config';
import { CommandType } from './application_command';

export type LanguageData = typeof import('../language/en-US.json');

export class Language {
  private static locale: LocaleString[] = [];
  private static data: Map<Partial<LocaleString>, LanguageData> = new Map();

  static locales(includeDefault: boolean = true) {
    if (this.locale.length < 1)
      this.locale = glob
        .sync(`${__dirname.replace(/\\/g, '/')}/../language/*.json`)
        .map(
          (v) => v.replace(/\\/g, '/').split('language/')[1].split('.json')[0],
        ) as LocaleString[];
    return includeDefault
      ? this.locale
      : this.locale.filter((v) => v != BotConfig.DEFAULT_LANGUAGE);
  }

  static async init() {
    const localeList = Object.values(Locale).map((v) => v.toString());
    for (const locale of this.locales())
      if (localeList.includes(locale))
        this.data.set(
          locale,
          (await import(`../language/${locale}.json`)).default,
        );
  }

  static get(
    locale: LocaleString,
    data: keyof LanguageData,
    ...formats: any[]
  ) {
    if (this.data.size < 1) return '';
    const result =
      this.data.get(locale)?.[data] ??
      this.data.get(BotConfig.DEFAULT_LANGUAGE)?.[data] ??
      '';
    if (!/{(\d+)}/g.test(result)) return result;
    return result.replace(/{(\d+)}/g, (match, number) => {
      return typeof formats[number] != 'undefined' ? formats[number] : match;
    });
  }

  static command(
    name: string,
  ): Pick<
    CommandType<ApplicationCommandType.ChatInput>,
    'name' | 'description' | 'localization'
  > {
    return {
      name: Language.get(
        BotConfig.DEFAULT_LANGUAGE,
        `Command_${name}_Name` as keyof LanguageData,
      ),
      description: Language.get(
        BotConfig.DEFAULT_LANGUAGE,
        `Command_${name}_Description` as keyof LanguageData,
      ),
      localization: {
        name: Language.locales()
          .map((v) => ({
            [v]: Language.get(v, `Command_${name}_Name` as keyof LanguageData),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
        description: Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${name}_Description` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      },
    };
  }

  static commandOption<T extends SharedNameAndDescription>(
    command_name: string,
    command_option: string,
    option: T,
  ): T {
    return option
      .setName(
        Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${command_name}_Option_${command_option}_Name` as keyof LanguageData,
        ),
      )
      .setDescription(
        Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${command_name}_Option_${command_option}_Description` as keyof LanguageData,
        ),
      )
      .setNameLocalizations(
        Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${command_name}_Option_${command_option}_Name` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      )
      .setDescriptionLocalizations(
        Language.locales()
          .map((v) => ({
            [v]: Language.get(
              v,
              `Command_${command_name}_Option_${command_option}_Description` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      );
  }

  static commandOptionChoice(
    command_name: string,
    command_option: string,
    command_choice: string[],
    option: SlashCommandStringOption,
  ) {
    return this.commandOption(command_name, command_option, option).addChoices(
      command_choice.map((v) => ({
        name: Language.get(
          BotConfig.DEFAULT_LANGUAGE,
          `Command_${command_name}_Option_${command_option}_Choice_${v}` as keyof LanguageData,
        ),
        value: v,
        name_localizations: Language.locales()
          .map((w) => ({
            [w]: Language.get(
              w,
              `Command_${command_name}_Option_${command_option}_Choice_${v}` as keyof LanguageData,
            ),
          }))
          .reduce((a, b) => ({ ...a, ...b })),
      })),
    );
  }
}
