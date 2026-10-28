import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { isLocale, type Locale } from '@/lib/enums'
import { readStorage, STORAGE_KEYS } from '@/lib/storage'

import { NAMESPACES, resources } from './resources'

/**
 * Detection: localStorage → browser language → ka. The UI language is a client-side
 * preference only (never stored on the server); the API gets it via Accept-Language.
 */
export function detectLocale(): Locale {
  const saved = readStorage(STORAGE_KEYS.locale)
  if (isLocale(saved)) return saved
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.slice(0, 2).toLowerCase()
  return isLocale(browser) ? browser : 'ka'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: 'en',
  supportedLngs: ['ka', 'en', 'ru'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
})

export default i18n
