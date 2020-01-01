module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.tsx$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          compiler: 'ttypescript',
        },
      },
    ],
  });

  config.resolve.extensions.push('.tsx');

  return config;
};
