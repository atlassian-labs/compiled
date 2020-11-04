module.exports = {
  plugins: [['@compiled/core/babel-plugin', { nonce: '"k0Mp1lEd"' }]],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
};
