module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 92],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'types',
        'revert',
        'infra',
      ],
    ],
    'scope-case': [0],
    'subject-exclamation-mark': [0],
  },
};
