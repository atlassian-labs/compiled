module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { browsers: 'last 1 version' } }],
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
