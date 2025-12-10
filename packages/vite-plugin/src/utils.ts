import * as fs from 'fs';
import { dirname } from 'path';

import type { Resolver } from '@compiled/babel-plugin';

import type { PluginOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const enhancedResolve = require('enhanced-resolve');

// Handle both ESM and CJS imports
const { CachedInputFileSystem, ResolverFactory } = enhancedResolve.CachedInputFileSystem
  ? enhancedResolve
  : enhancedResolve.default || enhancedResolve;

/**
 * Creates a default resolver using enhanced-resolve.
 * This is the same resolver used by webpack and other bundlers,
 * providing robust module resolution with caching.
 *
 * @param config - Vite plugin configuration
 * @returns Resolver compatible with @compiled/babel-plugin
 */
export function createDefaultResolver(config: PluginOptions): Resolver {
  const resolver = ResolverFactory.createResolver({
    fileSystem: new CachedInputFileSystem(fs, 4000),
    ...(config.extensions && {
      extensions: config.extensions,
    }),
    // This makes the resolver invoke the callback synchronously
    useSyncFileSystemCalls: true,
  });

  return {
    // The resolver needs to be synchronous, as babel plugins must be synchronous
    resolveSync(context: string, request: string) {
      return resolver.resolveSync({}, dirname(context), request) as string;
    },
  };
}
