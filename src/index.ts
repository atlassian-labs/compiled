/**
 * A simple module so that we can so some testing of
 * the configuration in the package (including for
 * generating documentation from comments like this :)
 *
 * @module index
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import pkg from '../package.json'

/**
 * Get the description of this package
 */
export function description(): string {
  return pkg.description
}
