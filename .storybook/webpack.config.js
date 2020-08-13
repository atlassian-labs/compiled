module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
      },
    ],
  });

  config.resolve.extensions.push('.tsx');

  return config;
};
