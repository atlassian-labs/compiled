const createTransformers = require('../dist/src/ts-transformer').default;

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          transpileOnly: true,
          getCustomTransformers: program => ({
            before: createTransformers(program, { debug: true }),
          }),
        },
      },
    ],
  });

  config.resolve.extensions.push('.tsx');

  return config;
};
