/**
 * Default resolver used by @compiled/babel-plugin when a custom resolver option
 * is not provided.
 */
const path = require('path');

const baseResolver = require('./base-resolver');

module.exports = {
  resolveSync: (context, request) => {
    return baseResolver(request, {
      basedir: path.dirname(context),
    });
  },
};
