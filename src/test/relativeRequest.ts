/**
 * Test-only shim: RTK Query's fetchBaseQuery does `new Request('/api/v1/...')`, and Node's
 * Request rejects relative URLs. Resolve them against jsdom's location (MSW handlers use
 * relative paths, which match the same origin). Loaded globally by src/test/setup.ts.
 */
const NativeRequest = globalThis.Request

if (!(NativeRequest as { __relative?: boolean }).__relative) {
  class RelativeRequest extends NativeRequest {
    static __relative = true

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === 'string' && input.startsWith('/') ? new URL(input, window.location.origin).toString() : input, init)
    }
  }
  globalThis.Request = RelativeRequest
}

export {}
