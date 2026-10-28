import 'i18next'

import type { ka } from './resources'

/** Typed keys: a missing or misspelled key is a TypeScript error. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof ka
  }
}
