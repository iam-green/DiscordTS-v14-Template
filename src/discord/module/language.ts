import { Locale, LocaleString } from 'discord.js';
import { glob } from 'glob';
import data from '../../language/en-US.json';

export type LanguageData = typeof data;

export class Language {
  private static locale: Record<
    'withDefault' | 'withoutDefault',
    LocaleString[]
  > = { withDefault: [], withoutDefault: [] };
  private static data: Partial<Record<LocaleString, LanguageData>> = {};

  static locales(includeDefault: boolean = true) {
    if (this.locale.withDefault.length < 1)
      this.locale.withDefault = glob
        .sync(`${__dirname.replace(/\\/g, '/')}/../../language/*.json`)
        .map(
          (v) => v.replace(/\\/g, '/').split('language/')[1].split('.json')[0],
        ) as LocaleString[];
    if (this.locale.withoutDefault.length < 1)
      this.locale.withoutDefault = this.locale.withDefault.filter(
        (v) => v != 'en-US',
      );
    return includeDefault
      ? this.locale.withDefault
      : this.locale.withoutDefault;
  }

  static async init() {
    const locales = glob
      .sync(`${__dirname.replace(/\\/g, '/')}/../../language/*.json`)
      .map(
        (v) => v.replace(/\\/g, '/').split('language/')[1].split('.json')[0],
      );
    const localeList = Object.values(Locale).map((v) => v.toString());
    for (const locale of locales)
      if (localeList.includes(locale))
        this.data[locale] = (await import(
          `../../language/${locale}.json`
        )) as LanguageData;
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
