import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import fil from '../locales/fil.json';
import ceb from '../locales/ceb.json';
import ilo from '../locales/ilo.json';
import hil from '../locales/hil.json';
import war from '../locales/war.json';
import bik from '../locales/bik.json';
import pam from '../locales/pam.json';
import pag from '../locales/pag.json';
import mdh from '../locales/mdh.json';

export type SupportedLanguageCode =
  | 'en'
  | 'fil'
  | 'ceb'
  | 'ilo'
  | 'hil'
  | 'war'
  | 'bik'
  | 'pam'
  | 'pag'
  | 'mdh';

export interface LanguageOption {
  code: SupportedLanguageCode;
  nativeName: string;
  englishName: string;
  regionHint: string;
}

export const PHILIPPINE_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', regionHint: 'National / Official' },
  { code: 'fil', nativeName: 'Filipino (Tagalog)', englishName: 'Filipino', regionHint: 'Luzon / National' },
  { code: 'ceb', nativeName: 'Cebuano (Bisaya)', englishName: 'Cebuano', regionHint: 'Baybay City, Visayas & Mindanao' },
  { code: 'war', nativeName: 'Waray', englishName: 'Waray', regionHint: 'Eastern Visayas / Leyte & Samar' },
  { code: 'hil', nativeName: 'Hiligaynon (Ilonggo)', englishName: 'Hiligaynon', regionHint: 'Western Visayas & SOCCSKSARGEN' },
  { code: 'ilo', nativeName: 'Ilokano', englishName: 'Ilocano', regionHint: 'Northern Luzon' },
  { code: 'bik', nativeName: 'Bikol', englishName: 'Bikol', regionHint: 'Bicol Region' },
  { code: 'pam', nativeName: 'Kapampangan', englishName: 'Kapampangan', regionHint: 'Central Luzon' },
  { code: 'pag', nativeName: 'Pangasinan', englishName: 'Pangasinan', regionHint: 'Ilocos / Pangasinan' },
  { code: 'mdh', nativeName: 'Maguindanaon', englishName: 'Maguindanaon', regionHint: 'BARMM / Cotabato' },
];

export const LANGUAGE_STORAGE_KEY = 'agapay_language';

function getInitialLanguage(): SupportedLanguageCode {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguageCode | null;
    if (saved && PHILIPPINE_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export const resources = {
  en: { translation: en },
  fil: { translation: fil },
  ceb: { translation: ceb },
  ilo: { translation: ilo },
  hil: { translation: hil },
  war: { translation: war },
  bik: { translation: bik },
  pam: { translation: pam },
  pag: { translation: pag },
  mdh: { translation: mdh },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function changeAppLanguage(code: SupportedLanguageCode) {
  i18n.changeLanguage(code);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // ignore storage errors
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
  }
}

export function getLanguageOption(code: string): LanguageOption {
  return (
    PHILIPPINE_LANGUAGES.find((l) => l.code === code) ?? PHILIPPINE_LANGUAGES[0]
  );
}

export default i18n;
