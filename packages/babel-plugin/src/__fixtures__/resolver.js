const { join } = require('path');

module.exports = {
  resolveSync(_, request) {
    if (request === 'test') {
      return join(__dirname, 'mixins', 'simple.js');
    }

    throw new Error('Unreachable code');
  },
};
