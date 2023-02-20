const classNameCompressionMap = require('./class-name-compression-map.json');

module.exports = {
  importReact: false,
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.customjsx'],
  parserBabelPlugins: ['typescript', 'jsx'],
  transformerBabelPlugins: [
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true,
      },
    ],
  ],
  extract: true,
  optimizeCss: false,
  classNameCompressionMap: classNameCompressionMap,
};
