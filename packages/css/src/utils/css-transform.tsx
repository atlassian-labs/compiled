import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import { unique } from '@compiled/utils';
import { discardDuplicates } from '../plugins/discard-duplicates';
import { parentOrphanedPseudos } from '../plugins/parent-orphaned-pseudos';
import { normalizeCSS } from '../plugins/normalize-css';
import { extractStyleSheets } from '../plugins/extract-stylesheets';
import { atomicifyRules } from '../plugins/atomicify-rules';
import { expandShorthands } from '../plugins/expand-shorthands';
import { sortAtRulePseudos } from '../plugins/sort-at-rule-pseudos';

/**
 * Will transform CSS into multiple CSS sheets.
 *
 * @param selector CSS selector such as `.class`
 * @param css CSS string
 * @param opts Transformation options
 */
export const transformCss = (css: string): { sheets: string[]; classNames: string[] } => {
  const sheets: string[] = [];
  const classNames: string[] = [];

  const result = postcss([
    discardDuplicates(),
    parentOrphanedPseudos(),
    nested(),
    ...normalizeCSS(),
    expandShorthands(),
    atomicifyRules({ callback: (className) => classNames.push(className) }),
    sortAtRulePseudos(),
    autoprefixer(),
    whitespace,
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
};
