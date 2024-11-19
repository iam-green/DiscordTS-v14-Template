import { Locale, LocaleString } from 'discord.js';
import { glob } from 'glob';
import { BotConfig } from '../config';

export type LanguageData = typeof import('../language/en-US.json');

export class Language {
  private static locale: LocaleString[] = [];
  private static data: Map<Partial<LocaleString>, LanguageData> = new Map();

  static locales(includeDefault: boolean = true) {
    if (this.locale.length < 1)
      this.locale = glob
        .sync(`${__dirname.replace(/\\/g, '/')}/../../language/*.json`)
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
        this.data.set(locale, await import(`../../language/${locale}.json`));
  }

  static get(
    locale: LocaleString,
    data: keyof LanguageData,
    ...formats: any[]
  ) {
    if (Object.keys(this.data).length < 1) return '';
    const result =
      this.data[locale]?.[data] ?? this.data['en-US']?.[data] ?? '';
    if (!/{(\d+)}/g.test(result)) return result;
    return result.replace(/{(\d+)}/g, (match, number) => {
      return typeof formats[number] != 'undefined' ? formats[number] : match;
    });
  }
}
