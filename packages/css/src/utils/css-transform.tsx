import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import { unique } from '@compiled/utils';
import { parentOrphanedPseudos } from '../plugins/parent-orphaned-pseudos';
import { minify } from '../plugins/minify';
import { extractStyleSheets } from '../plugins/extract-stylesheets';
import { atomicifyRules } from '../plugins/atomicify-rules';

interface Opts {
  /**
   * Enables minifying CSS through `cssnano`.
   */
  minify?: boolean;
}

/**
 * Will transform CSS into multiple CSS sheets.
 *
 * @param selector CSS selector such as `.class`
 * @param css CSS string
 * @param opts Transformation options
 */
export const transformCss = (css: string, opts: Opts = { minify: false }) => {
  const sheets: string[] = [];
  const classNames: string[] = [];

  const result = postcss([
    parentOrphanedPseudos(),
    nested(),
    atomicifyRules({ callback: (className) => classNames.push(className) }),
    autoprefixer(),
    ...(opts.minify ? minify() : [whitespace]),
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
