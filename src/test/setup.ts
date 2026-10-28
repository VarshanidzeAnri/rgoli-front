import './relativeRequest'
import '@testing-library/jest-dom/vitest'
import '@/i18n'

import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import i18n from '@/i18n'

import { server } from './msw/server'

// jsdom gaps used by Radix / layout code.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia
Element.prototype.scrollIntoView ??= () => undefined
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => undefined

beforeAll(async () => {
  server.listen({ onUnhandledFrame: 'error' })
  await i18n.changeLanguage('en')
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
