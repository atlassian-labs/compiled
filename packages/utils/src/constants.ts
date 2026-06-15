/**
 * The default package and the only package we use for runtimes.
 * Example: the default package used when suggesting autofixes for the `jsx` pragma
 */
export const COMPILED_IMPORT = '@compiled/react';

/**
 * The package providing Compiled's framework-agnostic ("vanilla") API.
 * Used by code paths that produce className strings without React.
 */
export const COMPILED_VANILLA_IMPORT = '@compiled/vanilla';

/**
 * A list of first-class packages we treat as valid import sources for Compiled.
 * Eg. for the `jsx` pragma, for `css` function, etc.
 */
export const DEFAULT_IMPORT_SOURCES = [COMPILED_IMPORT, '@atlaskit/css', COMPILED_VANILLA_IMPORT];
