/**
 * Verifies ka / en / ru have the same translation keys in every namespace.
 * Plural suffixes are normalised: ru may have _one/_few/_many/_other where ka/en have _one/_other,
 * but every plural base key must exist in all languages, with the forms that language requires.
 *
 * Usage: npm run check:i18n
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'src', 'i18n', 'locales')
const LOCALES = ['ka', 'en', 'ru'] as const
const PLURAL_FORMS: Record<(typeof LOCALES)[number], string[]> = {
  ka: ['one', 'other'],
  en: ['one', 'other'],
  ru: ['one', 'few', 'many', 'other'],
}
const PLURAL = /_(zero|one|two|few|many|other)$/

type Json = string | { [key: string]: Json }

function flatten(value: Json, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
}

let errors = 0
const fail = (message: string): void => {
  errors++
  console.error(`✗ ${message}`)
}

const namespaces = readdirSync(join(ROOT, 'ka')).filter((f) => f.endsWith('.json'))

for (const locale of LOCALES) {
  const files = readdirSync(join(ROOT, locale)).filter((f) => f.endsWith('.json'))
  for (const ns of namespaces) if (!files.includes(ns)) fail(`${locale}/${ns} is missing`)
  for (const ns of files) if (!namespaces.includes(ns)) fail(`${locale}/${ns} has no ka counterpart`)
}

for (const ns of namespaces) {
  const keys = Object.fromEntries(
    LOCALES.map((l) => [l, flatten(JSON.parse(readFileSync(join(ROOT, l, ns), 'utf8')) as Json)] as const),
  ) as Record<(typeof LOCALES)[number], string[]>

  const base = (k: string): string => k.replace(PLURAL, '')
  const reference = new Set(keys.ka.map(base))

  for (const locale of LOCALES) {
    const own = new Set(keys[locale].map(base))
    for (const key of reference) if (!own.has(key)) fail(`${locale}/${ns}: missing "${key}"`)
    for (const key of own) if (!reference.has(key)) fail(`${locale}/${ns}: extra "${key}" (not in ka)`)

    // Plural keys must have every form this language needs.
    const pluralBases = new Set(keys[locale].filter((k) => PLURAL.test(k)).map(base))
    for (const pb of pluralBases) {
      for (const form of PLURAL_FORMS[locale]) {
        if (!keys[locale].includes(`${pb}_${form}`)) fail(`${locale}/${ns}: "${pb}" lacks plural form _${form}`)
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} i18n problem(s).`)
  process.exit(1)
}
console.log(`✓ i18n keys match across ${LOCALES.join(', ')} (${namespaces.length} namespaces)`)
