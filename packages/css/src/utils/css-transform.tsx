import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import { parentOrphanedPseudos } from '../plugins/parent-orphaned-pseudos';
import { minify } from '../plugins/minify';
import { atomicify } from '../plugins/atomicify';
import { extractStyleSheets } from '../plugins/extract-stylesheets';

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
export const transformCss = (_: string, css: string, opts: Opts = { minify: false }): string[] => {
  const sheets: string[] = [];

  const result = postcss([
    parentOrphanedPseudos(),
    nested(),
    atomicify(),
    autoprefixer(),
    // Why is whitespace not applying as expected?
    ...(opts.minify ? minify() : [whitespace]),
    extractStyleSheets({ callback: (sheet) => sheets.push(sheet) }),
  ]).process(css, {
    from: undefined,
  });

  // We need to access something to make the transformation happen.
  result.css;

  return sheets;
};
