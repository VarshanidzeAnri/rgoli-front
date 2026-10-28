import js from '@eslint/js'
import i18next from 'eslint-plugin-i18next'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      i18next,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      // RTK Query uses `void` for endpoints without arguments (build.query<T, void>).
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // No hardcoded UI text: JSX text and user-visible attributes must come from i18n.
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          'jsx-attributes': { include: ['title', 'aria-label', 'placeholder', 'alt'] },
          // Regexes for text allowed without i18n: numbers/punctuation, CONSTANTS, separators and symbols.
          words: { exclude: ['[0-9!-/:-@[-`{-~\\s]+', '[A-Z_-]+', '[·₾%—×+\\s]+'] },
        },
      ],
    },
  },
  {
    // Tests, stories and tooling may use literal strings.
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**', 'scripts/**'],
    rules: { 'i18next/no-literal-string': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    // shadcn primitives export variants; the router module defines lazy route components.
    files: ['src/components/ui/**', 'src/app/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
