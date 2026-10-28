/**
 * Verifies src/lib/permissions.ts matches the Laravel seeder source
 * (rgoli-api/resources/permissions.json). Set RGOLI_API_DIR if the API lives elsewhere.
 *
 * Usage: npm run check:permissions
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { PERMISSION_GROUPS } from '../src/lib/permissions.ts'

const apiDir = resolve(process.env.RGOLI_API_DIR ?? join(import.meta.dirname, '..', '..', 'rgoli-api'))
const source = join(apiDir, 'resources', 'permissions.json')

if (!existsSync(source)) {
  console.warn(`! ${source} not found — skipping permission parity check.`)
  process.exit(0)
}

const backend = JSON.parse(readFileSync(source, 'utf8')) as { groups: Record<string, string[]> }
const front: Record<string, readonly string[]> = PERMISSION_GROUPS

const a = JSON.stringify(backend.groups)
const b = JSON.stringify(front)

if (a !== b) {
  console.error('✗ Permission catalog differs from the API.')
  console.error('  API:     ', a)
  console.error('  Frontend:', b)
  process.exit(1)
}

console.log(`✓ ${Object.values(front).flat().length} permissions match the API catalog`)
