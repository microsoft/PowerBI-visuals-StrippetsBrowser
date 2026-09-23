import parser from '@typescript-eslint/parser';

export default [{
    files: ['src/**/*.ts'],
    languageOptions: { parser },
    rules: {
        'no-debugger': 'error',
        'no-duplicate-case': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'error',
        'valid-typeof': 'error',
    },
}];