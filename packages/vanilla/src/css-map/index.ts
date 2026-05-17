import type { CssObject } from '../types';
import { createSetupError } from '../utils/error';

/**
 * Build-time stub for the vanilla `cssMap` API.
 *
 * At build time the Compiled Babel plugin replaces calls to this function with
 * a plain object whose values are the generated atomic class-name strings, and
 * inserts an `insertSheets(...)` call so the corresponding rules are added to
 * the document head when the module is loaded.
 *
 * If you are seeing this error at runtime, the Babel plugin (or Atlaspack
 * transformer) is not running on the file that called `cssMap`.
 *
 * ```ts
 * import { cssMap } from '@compiled/vanilla';
 *
 * const styles = cssMap({
 *   base: { color: 'red' },
 *   hover: { '&:hover': { color: 'darkred' } },
 * });
 *
 * element.className = styles.base;
 * ```
 *
 * The input is a record of variant names to nested CSS objects. Each variant
 * resolves to a className string at build time (composed of the atomic classes
 * needed to apply the variant's declarations). Unlike `@compiled/react`'s
 * `cssMap`, the values in the returned object are plain `string`s — there is
 * no `CompiledStyles<...>` brand because vanilla output is intended for direct
 * assignment to a DOM element's `className`.
 *
 * @typeParam TStyles - A record whose keys become the variant names and whose
 *   values are nested {@link CssObject} declarations.
 */
export default function cssMap<TStyles extends Record<string, CssObject>>(
  _styles: TStyles
): { readonly [P in keyof TStyles]: string } {
  throw createSetupError();
}
