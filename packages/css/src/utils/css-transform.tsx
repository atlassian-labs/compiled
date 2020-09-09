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
 * @param css CSS string
 * @param opts Transformation options
 */
export const transformCss = (css: string, opts: Opts = { minify: false }) => {
  const sheets: string[] = [];
  const classNames: string[] = [];

  const result = postcss([
    parentOrphanedPseudos(),
    nested(),
    atomicify({ callback: (className) => classNames.push(className) }),
    autoprefixer(),
    // Why is whitespace not applying as expected?
    ...(opts.minify ? minify() : [whitespace]),
    extractStyleSheets({ callback: (sheet) => sheets.push(sheet) }),
  ]).process(css, {
    from: undefined,
  });

  // We need to access something to make the transformation happen.
  result.css;

  return { sheets, classNames };
};
