import fs from 'fs';
import { dirname } from 'path';

import type { Resolver } from '@compiled/babel-plugin';
import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import type { ParcelTransformerOpts } from './types';

export function createDefaultResolver(config: ParcelTransformerOpts): Resolver {
  const resolver = ResolverFactory.createResolver({
    // @ts-expect-error - enhanced-resolve CachedInputFileSystem types are not
    // compatible with @types/node fs types
    fileSystem: new CachedInputFileSystem(fs, 4000),
    ...(config.extensions && {
      extensions: config.extensions,
    }),
    ...(config.resolve ?? {}),
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
