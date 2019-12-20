const createTransformers = require('../dist/src/ts-transformer').default;

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          // This NEEDS to be false for us to be able to go beyond module boundaries.
          // Might need to raise a ticket to figure out how we can get around this if we just want to transpile.
          // Does transpiling do it file by file instead of project?
          transpileOnly: false,
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
