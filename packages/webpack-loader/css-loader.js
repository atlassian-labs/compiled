/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

/**
 * This exists for local sessions so source files don't need to be built.
 * This is an unfortunate hack if you're reading this and have a spare
 * eng health week please find a better way to not have to do this.
 */
module.exports = fs.existsSync(path.join(__dirname, 'dist'))
  ? fs.existsSync(path.join(__dirname, 'dist', 'css-loader.js'))
    ? require('./dist/css-loader')
    : require('./src/css-loader')
  : require('./src/css-loader');
