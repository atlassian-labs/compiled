const createTransformers = require('../dist/src/ts-transformer').default;

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          getCustomTransformers: program => ({
            before: createTransformers(program, { debug: process.env.NODE_ENV !== 'production' }),
          }),
        },
      },
    ],
  });

  config.resolve.extensions.push('.tsx');

  return config;
};
