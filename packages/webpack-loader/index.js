// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsNode = require('ts-node');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsPaths = require('tsconfig-paths');

tsNode.register({
  transpileOnly: true,
  project: __dirname + '/tsconfig.json',
});

tsPaths.register();

/**
 * This exists for local sessions so source files don't need to be built.
 * This is an unfortunate hack if you're reading this and have a spare
 * eng health week please find a better way to not have to do this.
 */
module.exports = require('./src/index');
