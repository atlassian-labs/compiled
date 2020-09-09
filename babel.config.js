module.exports = {
  plugins: [['@compiled/babel-plugin', { nonce: '"k0Mp1lEd"', minify: true }]],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
};
