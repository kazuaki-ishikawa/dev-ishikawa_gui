import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  { ignores: ['**/nuxt.config.ts'] },
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@stylistic': stylistic,
    },
    // prettier-ignore
    rules: {
      'curly': ['error', 'all'],
      'brace-style': [
        'error',
        '1tbs',
        {
          allowSingleLine: false,
        },
      ],
      'vue/html-indent': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
          },
        },
      ],
      'vue/no-v-html': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiword-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|': 'before' } }],
      'vue/quote-props': ['error', 'as-needed'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
      '@typescript-eslint/unified-signatures': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/operator-linebreak': [
        'error',
        'after',
        { overrides: { '?': 'before', ':': 'before', '|': 'before' } },
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none' },
          singleline: { delimiter: 'semi', requireLast: false },
          multilineDetection: 'brackets',
        },
      ],
    },
  },
])
