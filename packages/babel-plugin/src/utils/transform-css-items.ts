import * as t from '@babel/types';
import { transformCss } from '@compiled/css';

import { getItemCss } from './css-builders';
import type { CssItem, Sheet } from './types';

/**
 * Splits a single item's styles into sheets and an expression that handles
 * className logic at runtime.
 *
 * @param item {CssItem}
 */
const transformCssItem = (
  item: CssItem
): {
  sheets: Sheet[];
  classExpression?: t.Expression;
} => {
  switch (item.type) {
    case 'reference':
      return {
        classExpression: t.identifier(item.reference),
        sheets: [{ type: 'reference', reference: item.reference }]
      };

    case 'conditional':
      const consequent = transformCssItem(item.consequent);
      const alternate = transformCssItem(item.alternate);
      const defaultExpression = t.identifier('undefined');

      return {
        sheets: [...consequent.sheets, ...alternate.sheets],
        classExpression: t.conditionalExpression(
          item.test,
          consequent.classExpression || defaultExpression,
          alternate.classExpression || defaultExpression
        ),
      };

    case 'logical':
      const logicalCss = transformCss(getItemCss(item));

      return {
        sheets: logicalCss.sheets.map(sheet => ({ type: 'css', css: sheet })),
        classExpression: t.logicalExpression(
          item.operator,
          item.expression,
          t.stringLiteral(logicalCss.classNames.join(' '))
        ),
      };

    default:
      const css = transformCss(getItemCss(item));
      const className = css.classNames.join(' ');

      return {
        sheets: css.sheets.map(sheet => ({ type: 'css', css: sheet })),
        classExpression: className.trim() ? t.stringLiteral(className) : undefined,
      };
  }
};

/**
 * Transforms CSS output into `sheets` and a list of expressions for determining
 * the classNames for a component at runtime.
 *
 * @param cssItems {CssItem[]}
 */
export const transformCssItems = (
  cssItems: CssItem[]
): { sheets: Sheet[]; classNames: t.Expression[] } => {
  const sheets: Sheet[] = [];
  const classNames: t.Expression[] = [];

  for (const item of cssItems) {
    const result = transformCssItem(item);

    sheets.push(...result.sheets);
    if (result.classExpression) {
      classNames.push(result.classExpression);
    }
  }

  return { sheets, classNames };
};
