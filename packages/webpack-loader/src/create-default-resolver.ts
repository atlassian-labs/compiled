import fs from 'fs';
import { dirname } from 'path';

import type { Resolver } from '@compiled/babel-plugin';
import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';
import type { ResolveOptions } from 'webpack';

type Config = {
  resolveOptions: ResolveOptions;
  webpackResolveOptions: ResolveOptions | undefined;
};

export function createDefaultResolver({ resolveOptions, webpackResolveOptions }: Config): Resolver {
  // Setup the default resolver, where webpack will merge any passed in options with the default
  // resolve configuration. Ideally, we use this.getResolve({ ...resolve, useSyncFileSystemCalls: true, })
  // However, it does not work correctly when in development mode :/
  const resolver = ResolverFactory.createResolver({
    // @ts-expect-error
    fileSystem: new CachedInputFileSystem(fs, 4000),
    ...(webpackResolveOptions ?? {}),
    ...resolveOptions,
    // This makes the resolver invoke the callback synchronously
    useSyncFileSystemCalls: true,
  });

  return {
    // The resolver needs to be synchronous, as babel plugins must be synchronous
    resolveSync: (context: string, request: string) => {
      return resolver.resolveSync({}, dirname(context), request) as string;
    },
  };
}
