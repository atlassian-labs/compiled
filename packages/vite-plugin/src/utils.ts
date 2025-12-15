import * as fs from 'fs';
import { dirname } from 'path';

import type { Resolver } from '@compiled/babel-plugin';
import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import type { PluginOptions } from './types';

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
    // @ts-expect-error - enhanced-resolve CachedInputFileSystem types are not compatible with Node.js fs types, but work at runtime
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
