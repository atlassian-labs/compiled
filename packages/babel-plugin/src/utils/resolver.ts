import { dirname, join } from 'path';

import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';
import resolve from 'resolve';

import { DEFAULT_CODE_EXTENSIONS } from '../constants';
import type { PluginOptions, Resolver } from '../types';

export const initializeResolver = (opts: PluginOptions): Resolver => {
  const { resolver, resolverConfig } = opts;

  if (resolver) {
    if (resolverConfig) {
      throw new Error(
        'A customer resolver cannot be specified at the same time as a resolver config'
      );
    }
    return resolver;
  }

  if (resolverConfig) {
    const { type, ...config } = resolverConfig;
    if (type === 'enhanced-resolver') {
      const enhancedResolver = ResolverFactory.createResolver({
        // @ts-expect-error
        fileSystem: new CachedInputFileSystem(fs, 4000),
        ...config,
        // This makes the resolver invoke the callback synchronously
        useSyncFileSystemCalls: true,
      });

      return {
        resolveSync: (context: string, request: string) => {
          return enhancedResolver.resolveSync({}, dirname(context), request);
        },
      };
    }
  }

  return {
    resolveSync: (filename: string, request: string): string => {
      const id = request.charAt(0) === '.' ? join(dirname(filename), request) : request;

      return resolve.sync(id, {
        extensions: opts.extensions ?? DEFAULT_CODE_EXTENSIONS,
      });
    },
  };
};
