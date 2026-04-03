import { en } from './en.js';
import { ar } from './ar.js';

export type Lang = 'en' | 'ar';
export type Translations = typeof en;

const translations = { en, ar }

/**
 * Returns the translation dictionary for the given language.
 * Falls back to English for any unsupported locale.
 */
export const getTranslations = (lang: Lang = 'en'): Translations => {
  return (translations[lang] ?? translations.en) as Translations;
};

export { en, ar };
