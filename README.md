# RGOLI ZEROFRAME OS — SPA

React 19 + TypeScript + Vite single-page app for the RGOLI studio OS. Full setup, demo logins and architecture:
see the workspace [README](../README.md) and [docs](../docs).

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; defaults proxy /api to http://localhost:8000
npm run dev                  # http://localhost:5173
```

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` / `build` / `preview` | Vite dev server / production build / preview |
| `npm run typecheck` | `tsc -b` (strict, `noUncheckedIndexedAccess`, typed i18n keys) |
| `npm run lint` | ESLint (typescript-eslint strict, react-hooks, jsx-a11y, i18next no-literal-string) |
| `npm run format` | Prettier (+ Tailwind class sorting) |
| `npm run test` / `test:coverage` | Vitest + Testing Library + MSW |
| `npm run test:e2e` | Playwright (needs the API running with demo data) |
| `npm run check:i18n` | ka / en / ru key parity incl. plural forms |
| `npm run check:permissions` | permission union matches `rgoli-api/resources/permissions.json` |
| `npm run check` | everything above except e2e |

## Layout

`src/app` router & providers · `src/store` Redux Toolkit (auth, ui) + RTK Query base · `src/features/<x>/api.ts`
endpoints + `components/` · `src/components/{kit,ui,layout}` · `src/pages` (lazy routes) · `src/i18n` ·
`src/lib` (format, permissions, enums, forms) · `src/types/api.ts` (mirrors Laravel Resources).

Language and theme are saved in `localStorage` only (`rgoli.locale`, `rgoli.theme`); the auth token in
`rgoli.token`.
