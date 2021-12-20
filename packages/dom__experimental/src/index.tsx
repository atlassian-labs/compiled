import { createSetupError } from './error';
import insertRule from './sheet';
import type { AnyKeyCssProps, CSSProps } from './types';

type ClassNames = string | false | undefined | ClassNames[];

/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;
const UNDERSCORE_UNICODE = 95;

/**
 * Unique cache not yet shared with @compiled/react pkg.
 */
const STYLE_INSERT_CACHE: Record<string, true> = {};

function collectDecls(classNames: ClassNames[], outDecls: Record<string, string>): void {
  for (let i = 0; i < classNames.length; i++) {
    const className = classNames[i];

    if (Array.isArray(className)) {
      collectDecls(className, outDecls);
    } else if (className) {
      const parts = className.split(' ');

      for (let x = 0; x < parts.length; x++) {
        const part = parts[x];
        const endPosition = part.charCodeAt(0) === UNDERSCORE_UNICODE ? ATOMIC_GROUP_LENGTH : -1;
        const atomicGroupName = part.slice(0, endPosition);

        outDecls[atomicGroupName] = part;
      }
    }
  }
}

/**
 * Concatenates strings together into a class name ensuring uniqueness across Compiled atomic declarations with the last taking precedence,
 * order of class names is not guaranteed.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  red: { color: 'red' },
 *  blue: { color: 'blue' },
 * });
 *
 * cstyle([styles.red, styles.blue]); // _syaz13q2
 * ```
 *
 * Nested arrays can be used to conditionally apply multiple styles at once.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  base: { fontWeight: 500 },
 *  blue: { color: 'blue' },
 *  interactive: { cursor: 'pointer' },
 * });
 *
 * cstyle([styles.base, false && [styles.blue, styles.interactive]]); // _k48pbfng
 * ```
 */
export const cstyle = (classNames: ClassNames[]): string | undefined => {
  const decls: Record<string, string> = {};

  collectDecls(classNames, decls);

  const str = [];

  for (const key in decls) {
    const value = decls[key];
    str.push(value);
  }

  return str.join(' ');
};

/**
 * Create multiple style declarations using object notation.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  base: { fontWeight: 500 },
 *  blue: { color: 'blue' },
 *  interactive: { cursor: 'pointer' },
 * });
 *
 * styles.base // _k48pbfng
 * ```
 */
cstyle.create = <TKeys extends string>(
  _styles: Record<TKeys, AnyKeyCssProps<void> | CSSProps>
): Record<TKeys, string> => {
  if (process.env.NODE_ENV !== 'production') {
    throw createSetupError();
  }

  throw 'cpld';
};

export const insertStyles = (styles: string[]): void => {
  if (typeof document === 'undefined') {
    return;
  }

  for (let i = 0; i < styles.length; i++) {
    if (!STYLE_INSERT_CACHE[styles[i]]) {
      STYLE_INSERT_CACHE[styles[i]] = true;
      insertRule(styles[i]);
    }
  }
};
