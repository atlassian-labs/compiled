/**
 * Throws a setup error explaining that `@compiled/vanilla` is being used at
 * runtime — which means the Compiled Babel plugin did not transform the call
 * site. The functions in this package are compile-time stubs and have no
 * meaningful runtime behaviour.
 */
export const createSetupError = (): Error =>
  new Error(
    "@compiled/vanilla isn't set up correctly. Make sure the Compiled Babel plugin (or Atlaspack transformer) is configured to transform files using `@compiled/vanilla`. See https://compiledcssinjs.com for setup instructions."
  );
