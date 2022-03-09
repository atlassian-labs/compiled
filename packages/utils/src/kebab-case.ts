const KEBAB_REGEX = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g;

/**
 * Transforms a string into kebab-case.
 *
 * @param str
 */
export function kebabCase(str: string): string {
  return str.replace(KEBAB_REGEX, (match) => {
    return `-${match.toLowerCase()}`;
  });
}
