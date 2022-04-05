module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: '>= 15',
    },
  },
  plugins: [
    'norterms',
  ],
  rules: {
    'norterms/replacement': ['warn', { forceUpdateConfig: true, configSrc: 'https://gitee.com/Xashen/eslint-plugin-norterms/raw/master/config' }],
  },
};
