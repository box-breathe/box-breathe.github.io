export interface LanguageInfo {
  code: 'en' | 'es' | 'pt' | 'de' | 'fr' | 'ja' | 'zh';
  badge: string;
  label: string;
  nativeName: string;
  path: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', badge: 'US', label: 'English', nativeName: 'English', path: '/' },
  { code: 'es', badge: 'ES', label: 'Spanish', nativeName: 'Español', path: '/es/' },
  { code: 'pt', badge: 'BR', label: 'Portuguese', nativeName: 'Português', path: '/pt/' },
  { code: 'de', badge: 'DE', label: 'German', nativeName: 'Deutsch', path: '/de/' },
  { code: 'fr', badge: 'FR', label: 'French', nativeName: 'Français', path: '/fr/' },
  { code: 'ja', badge: 'JP', label: 'Japanese', nativeName: '日本語', path: '/ja/' },
  { code: 'zh', badge: 'CN', label: 'Chinese', nativeName: '简体中文', path: '/zh/' },
];

export const DEFAULT_LANGUAGE = 'en';

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
