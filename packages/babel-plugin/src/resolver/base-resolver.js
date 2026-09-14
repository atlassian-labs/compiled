/**
 * Base resolver, used by tool-specific resolvers.
 * This is used to make sure that packages resolve using the same algorithm as our webpack config
 *  (checking for "browser", "main", etc) meaning that we dont need the old root index.js hack anymore
 */
const fs = require('fs');
const path = require('path');

const enhancedResolve = require('enhanced-resolve');
const resolveFrom = require('resolve-from');

const BASE_DIR = path.resolve(__dirname, '..', '..', '..');

const requireCache = new Map();

const cached = (key, fn) => {
  if (requireCache.has(key)) {
    return requireCache.get(key);
  }
  const result = fn();
  requireCache.set(key, result);
  return result;
};

// This is the resolver used by webpack, which we configure similarly
// to AK website (see ./website/webpack.config.js - "resolve" field)
const wpResolver = enhancedResolve.ResolverFactory.createResolver({
  fileSystem: new enhancedResolve.CachedInputFileSystem(fs, 4000),
  useSyncFileSystemCalls: true,
  mainFields: ['browser', 'main'],
  extensions: ['.js', '.ts', '.tsx', '.json', '.d.ts'],
  conditionNames: ['import', 'require', 'types', 'default'],
});

const nodeResolver = enhancedResolve.ResolverFactory.createResolver({
  fileSystem: new enhancedResolve.CachedInputFileSystem(fs, 4000),
  useSyncFileSystemCalls: true,
  mainFields: ['main'],
  extensions: ['.js', '.ts', '.tsx', '.json', '.d.ts', '.node'],
  conditionNames: ['node', 'import', 'require', 'types', 'default'],
});

const exceptionList = Object.freeze([
  /@atlassian\/parcel/,
  /@parcel\//,
  'parcel',
  'self-published',
]);

const resolveNode = (modulePath, opts) => {
  for (const exception of exceptionList) {
    if (
      (typeof exception === 'string' && exception === modulePath) ||
      (exception instanceof RegExp && exception.test(modulePath))
    ) {
      return nodeResolver.resolveSync({}, opts.basedir, modulePath);
    }
  }
  return undefined;
};

const resolveModule = (basePath, module) =>
  cached(`m:${basePath}/${module}`, () => {
    try {
      return wpResolver.resolveSync({}, basePath, module);
    } catch {
      return undefined;
    }
  });

const followSymLink = (file) =>
  // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.
  // @link https://github.com/facebook/jest/pull/4761
  fs.realpathSync(file);

const resolveRelative = (modulePath /*: string */, opts /*: Object */) => {
  // If resolving relative paths, make sure we use resolveFrom and not resolve
  if (modulePath.startsWith('.') || modulePath.startsWith(path.sep)) {
    return cached(`r:${opts.basedir}/${modulePath}`, () => {
      try {
        // resolveFrom could not "see" .ts/.tsx files
        // the only registered extensions are `.js`, `.json` and `.node`
        return resolveFrom(opts.basedir, modulePath);
      } catch {
        return undefined;
      }
    });
  }
  return undefined;
};

const resolveNamedEntry = (modulePath /*: string */) => {
  return resolveModule(BASE_DIR, modulePath);
};

const resolveAbsolute = (modulePath /*: string */, opts /*: Object */) =>
  resolveModule(opts.basedir, modulePath);

/**
 * @typedef {Object} Opts - resolver options
 * @property {string} basedir - The base directory of the file importing modulePath
 */
/**
 * Base resolver
 *
 * @param {string} modulePath - The module path to be resolved
 * @param {Opts} opts - Resolver options
 */
module.exports = function resolver(modulePath /*: string */, opts /*: Object */) {
  return (
    resolveRelative(modulePath, opts) ||
    resolveNamedEntry(modulePath, opts) ||
    resolveNode(modulePath, opts) ||
    followSymLink(resolveAbsolute(modulePath, opts))
  );
};
