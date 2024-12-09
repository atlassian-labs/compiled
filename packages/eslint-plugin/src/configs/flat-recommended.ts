export const flatRecommended = {
  // plugin is not specified here because flat config needs a reference to the plugin
  rules: {
    '@compiled/local-cx-xcss': 'error',
    '@compiled/no-css-prop-without-css-function': 'error',
    '@compiled/no-css-tagged-template-expression': 'error',
    '@compiled/no-empty-styled-expression': 'error',
    '@compiled/no-exported-css': 'error',
    '@compiled/no-exported-keyframes': 'error',
    '@compiled/no-invalid-css-map': 'error',
    '@compiled/no-js-xcss': 'error',
    '@compiled/no-keyframes-tagged-template-expression': 'error',
    '@compiled/no-styled-tagged-template-expression': 'error',
    '@compiled/no-suppress-xcss': 'error',
    '@compiled/shorthand-property-sorting': 'error',
  },
} as const;
