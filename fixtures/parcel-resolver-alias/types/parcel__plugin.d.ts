declare module '@parcel/plugin' {
  interface ResolveResult {
    filePath: string;
  }

  type Dependency = {
    resolveFrom: string;
    moduleSpecifier: string;
  };

  type ResolveOpts = {
    dependency: Dependency;
  };

  interface ResolverOpts {
    resolve(opts: ResolveOpts): Promise<ResolveResult | null>;
  }

  export class Resolver {
    constructor(opts: ResolverOpts);
  }
}
