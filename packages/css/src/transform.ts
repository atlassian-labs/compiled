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
   * When `true`, rules whose selector contains a CSS combinator (descendant ` `,
   * child `>`, adjacent sibling `+`, general sibling `~`) are emitted as a
   * single grouped rule with one class name instead of being split into one
   * atomic class per declaration.
   *
   * This reduces the number of generated atomic classes for complex selectors
   * but changes the runtime composition semantics: because a grouped rule maps
   * multiple declarations to a single class, the `ax()`/`ac()` "last wins"
   * atomic merging strategy cannot override individual declarations within the
   * group. Two grouped rules that target the same combinator selector but differ
   * in one declaration will both survive `ax()` (they carry different class
   * hashes) and the final result is determined by CSS cascade order rather than
   * by atomic composition. Consumers should be aware that per-property overrides
   * are not possible for grouped rules.
   *
   * @default false
   */
  group?: boolean;
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
        group: !!localOpts.group,
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
