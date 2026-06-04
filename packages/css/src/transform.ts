import { createError, unique } from '@compiled/utils';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

import { atomicifyRules } from './plugins/atomicify-rules';
import { discardDuplicates } from './plugins/discard-duplicates';
import { discardEmptyRules } from './plugins/discard-empty-rules';
import { expandShorthands } from './plugins/expand-shorthands';
import { extractStyleSheets } from './plugins/extract-stylesheets';
import { flattenMultipleSelectors } from './plugins/flatten-multiple-selectors';
import { increaseSpecificity } from './plugins/increase-specificity';
import { normalizeCSS } from './plugins/normalize-css';
import { parentOrphanedPseudos } from './plugins/parent-orphaned-pseudos';
import { sortAtomicStyleSheet } from './plugins/sort-atomic-style-sheet';
export interface TransformOpts {
  optimizeCss?: boolean;
  classNameCompressionMap?: Record<string, string>;
  increaseSpecificity?: boolean;
  sortAtRules?: boolean;
  sortShorthand?: boolean;
  classHashPrefix?: string;
  flattenMultipleSelectors?: boolean;
}

/**
 * As oppose to TransformOpts which are babel plugin level options,
 * LocalTransformOptions control each individual transformation separately.
 */
export interface LocalTransformOptions {
  /**
   * Controls the algorithm used to generate the group portion of each atomic class name.
   *
   * ## Background
   *
   * Every atomic class name has the shape `_<group><value>` where:
   * - `<group>` is a hash of the CSS property + selector, used by the `ax()` runtime to
   *   identify which CSS axis (property + selector combination) a class belongs to.
   * - `<value>` is a hash of the CSS value.
   *
   * The default implementation has a known bias: `.toString(36).slice(0, 4)` produces
   * leading digits that are heavily skewed toward `'1'` (~50% of outputs), reducing the
   * effective hash space from the theoretical 36⁴ = 1.68M to only ~93K unique groups.
   * This causes silent style bugs when two different CSS properties in the same component
   * produce the same group hash — `ax()` silently drops one of them.
   *
   * ## Strategies
   *
   * ### `'default'` (backward-compatible, not recommended for new code)
   * Uses `hash(key).slice(0, 4)` — the original implementation.
   * Produces 9-character class names (`_GGGGVVVV`).
   * Suffers from leading-digit bias that reduces effective hash space to ~5.6% of
   * the theoretical maximum. Kept only for backward compatibility.
   *
   * ### `'enhanced'` (recommended drop-in improvement)
   * Uses base-62 encoding (`0-9`, `a-z`, `A-Z`) with `slice(-4)` to take the
   * low-order digits, eliminating the leading-digit bias.
   * Produces 9-character class names (`_GGGGVVVV`) — same shape as `'default'`,
   * so existing CSS snapshots only change hash values, not structure.
   * Provides 62⁴ = 14.8M unique group hashes — 8.8× more than `'default'`.
   * Safe to mix with packages that were compiled with `'default'` because the
   * same murmurhash2 input always produces the same base-62 output; the
   * `ax()` runtime groups classes by stripping the last 4 characters as the
   * value hash, so both formats are compatible.
   *
   * ### `'max'` (cross-package collision prevention)
   * Uses the full 32-bit murmurhash2 output encoded in base-62 (6 characters)
   * for the group hash, plus 4 base-62 characters for the value hash.
   * Produces 11-character class names (`_GGGGGGVVVV`).
   * Provides 62⁶ = 56.8B unique group hashes — effectively zero collision
   * probability even for very large stylesheets.
   * **Important:** The 11-char shape is structurally incompatible with the 9-char
   * shape of `'default'` and `'enhanced'`. When using `xcss` overrides across
   * package boundaries (e.g. `<Box xcss={customStyles} />`), both the consumer
   * and the package being overridden must use the same hash strategy, otherwise
   * `ax()` cannot correctly deduplicate the classes.
   *
   * ## Migration path
   *
   * 1. Opt individual `cssMap` calls into `'enhanced'` — zero risk, same class shape.
   * 2. Once all packages in a deployment are rebuilt, flip to `'max'` for the strongest
   *    collision guarantees.
   *
   * @default 'default'
   */
  hashStrategy?: string;
}

/**
 * Will transform CSS into multiple CSS sheets.
 *
 * @param css CSS string
 * @param opts Transformation options
 */
export const transformCss = (
  css: string,
  opts: TransformOpts,
  localOpts: LocalTransformOptions = {}
): { sheets: string[]; classNames: string[] } => {
  const sheets: string[] = [];
  const classNames: string[] = [];

  // This is defaulted to `true` unless set
  const flattenMultipleSelectorsOption = opts.flattenMultipleSelectors ?? true;

  try {
    const result = postcss([
      discardDuplicates(),
      discardEmptyRules(),
      parentOrphanedPseudos(),
      nested({
        bubble: [
          'container',
          '-moz-document',
          'layer',
          'else',
          'when',
          // postcss-nested bubbles `starting-style` by default in versions from 6.0.2 onwards:
          // https://github.com/postcss/postcss-nested?tab=readme-ov-file#bubble
          // When we upgrade to a version that includes this change, we can remove this from the list.
          'starting-style',
        ],
        unwrap: ['color-profile', 'counter-style', 'font-palette-values', 'page', 'property'],
      }),
      ...normalizeCSS(opts),
      expandShorthands(),
      atomicifyRules({
        classNameCompressionMap: opts.classNameCompressionMap,
        callback: (className: string) => classNames.push(className),
        classHashPrefix: opts.classHashPrefix,
        hashStrategy: localOpts.hashStrategy ?? 'default',
      }),
      ...(flattenMultipleSelectorsOption ? [flattenMultipleSelectors(), discardDuplicates()] : []),
      ...(opts.increaseSpecificity ? [increaseSpecificity()] : []),
      sortAtomicStyleSheet({
        sortAtRulesEnabled: opts.sortAtRules,
        sortShorthandEnabled: opts.sortShorthand,
      }),
      ...(process.env.AUTOPREFIXER === 'off' ? [] : [autoprefixer()]),
      whitespace(),
      extractStyleSheets({ callback: (sheet: string) => sheets.push(sheet) }),
    ]).process(css, {
      from: undefined,
    });

    // We need to access something to make the transformation happen.
    result.css;

    return {
      sheets,
      classNames: unique(classNames),
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : e;
    throw createError(
      'css',
      'Unhandled exception'
    )(
      `An unhandled exception was raised when parsing your CSS, this is probably a bug!
  Raise an issue here: https://github.com/atlassian-labs/compiled/issues/new?assignees=&labels=&template=bug_report.md&title=CSS%20Parsing%20Exception:%20

  Input CSS: {
    ${css}
  }

  Exception: ${message}`
    );
  }
};
