module.exports = {
  addons: ['storybook-addon-performance/register', 'storybook-addon-pseudo-states'],
  core: {
    builder: 'webpack5',
  },
  stories: ['../examples/stories/*.tsx'],
};
