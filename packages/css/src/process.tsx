import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import whitespace from 'postcss-normalize-whitespace';
import { normalizeCSS } from './plugins/normalize-css';

/**
 * Processes CSS as a style sheet.
 *
 * @param stylesheet
 * @returns
 */
export function process(stylesheet: string): string {
  const result = postcss([...normalizeCSS(), autoprefixer(), whitespace]).process(stylesheet, {
    from: undefined,
  });

  return result.css;
}
