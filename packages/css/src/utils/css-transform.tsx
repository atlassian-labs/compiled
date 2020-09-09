import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import { parentOrphanedPseudos } from '../plugins/parent-orphaned-pseudos';
import { minify } from '../plugins/minify';
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
export const transformCss = (
  selector: string,
  css: string,
  opts: Opts = { minify: false }
): string[] => {
  const sheets: string[] = [];
  const cssWithSelector = selector ? `${selector} { ${css} }` : css;

  const result = postcss([
    parentOrphanedPseudos(),
    nested(),
    autoprefixer(),
    ...(opts.minify ? minify() : [whitespace]),
    extractStyleSheets({ callback: (sheet: string) => sheets.push(sheet) }),
  ]).process(cssWithSelector, {
    from: undefined,
  });

  // We need to access something to make the transformation happen.
  result.css;

  return sheets;
};
