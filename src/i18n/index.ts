import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import { DEFAULT_LANGUAGE, type LanguageCode } from './languages';

export const translations = {
  en,
  es,
  pt,
  de,
  fr,
  ja,
  zh,
} as const;

export type TranslationKey = typeof en;

export function getTranslations(lang: LanguageCode | string): TranslationKey {
  if (lang in translations) {
    return translations[lang as LanguageCode];
  }
  return translations[DEFAULT_LANGUAGE];
}

export function getLanguageFromURL(pathname: string): LanguageCode {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && (firstSegment in translations)) {
    return firstSegment as LanguageCode;
  }
  return DEFAULT_LANGUAGE;
}

export function getLocalizedPath(lang: LanguageCode, currentPath: string = '/'): string {
  // Strip existing lang prefix if present
  let cleanPath = currentPath;
  const supported = ['es', 'pt', 'de', 'fr', 'ja', 'zh'];
  for (const s of supported) {
    if (cleanPath.startsWith(`/${s}/`)) {
      cleanPath = cleanPath.slice(`/${s}`.length);
      break;
    } else if (cleanPath === `/${s}`) {
      cleanPath = '/';
      break;
    }
  }

  if (lang === 'en') {
    return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  }

  return `/${lang}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
}
