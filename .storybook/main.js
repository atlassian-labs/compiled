module.exports = {
  addons: ['storybook-addon-performance/register', 'storybook-addon-pseudo-states'],
  core: {
    builder: 'webpack5',
  },
  stories: ['../examples/stories/*.tsx'],
  // Workaround for https://github.com/storybookjs/storybook/issues/15336
  typescript: { reactDocgen: false },
};
