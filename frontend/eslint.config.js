import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] }, // Equivalent to globalIgnores
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // This fixes @tailwind warnings in CSS files
  {
    files: ['**/*.css'],
    rules: {
      'unknownAtRules': 'off',
    },
  },
]
module.exports = {
  // ... your existing config
  overrides: [
    {
      files: ["*.css"],
      rules: {
        // Disable all rules for CSS, or just the problematic ones
        "no-unused-vars": "off",
        // Or more targeted if you know the exact rule triggering it
      },
    },
  ],
};