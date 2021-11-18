/*
 * Extracts the keyframes CSS from the `@compiled/react` keyframes usage.
 *
 * @param expression {t.CallExpression | t.TaggedTemplateExpression} The keyframes declaration
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 * @returns {CSSOutput} The keyframes CSS
 */
import generate from '@babel/generator';
import type * as t from '@babel/types';
import { transformCss } from '@compiled/css';
import { hash } from '@compiled/utils';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCss, getItemCss } from '../utils/css-builders';
import type { CSSOutput } from '../utils/types';

const toCSSRule = (selector: string, result: CSSOutput) => ({
  ...result,
  css: result.css.map((x) => ({ ...x, css: `${selector} { ${getItemCss(x)} }` })),
});

export type Keyframes = {
  css: string[];
  name: string;
};

export const getKeyframes = (
  node: t.ObjectExpression | t.StringLiteral | t.TemplateLiteral,
  meta: Metadata
): Keyframes => {
  // Keyframes cannot start with a number, so let's prefix it with a character
  const name = `k${hash(generate(node).code)}`;
  const selector = `@keyframes ${name}`;
  // TODO variables???
  const { css } = toCSSRule(selector, buildCss(node, { ...meta, context: 'root' }));

  const unexpectedCss = css.some((item) => item.type !== 'unconditional');
  if (unexpectedCss) {
    throw buildCodeFrameError('Keyframes contains unexpected CSS', node, meta.parentPath);
  }

  // TODO check classNames?
  const { sheets } = transformCss(css.map((x) => x.css).join(''));
  if (sheets.length !== 1) {
    throw buildCodeFrameError(
      `Expected 1 keyframe sheet, but got ${sheets.length}`,
      node,
      meta.parentPath
    );
  }

  return {
    css: sheets,
    name,
  };
};
