const createCssFreedomTransformer = require('../dist/src/transformer').default;

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          transpileOnly: true,
          getCustomTransformers: () => ({
            before: [createCssFreedomTransformer({ debug: true })],
          }),
        },
      },
    ],
  });

  config.resolve.extensions.push('.tsx');

  return config;
};
