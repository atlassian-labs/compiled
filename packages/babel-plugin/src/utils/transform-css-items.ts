import * as t from '@babel/types';
import { transformCss } from '@compiled/css';

import type { Metadata } from '../types';

import { compressClassNamesForRuntime } from './compress-class-names-for-runtime';
import { getItemCss } from './css-builders';
import type { CssItem } from './types';

type TransformOptions = {
  atomic?: boolean;
  /**
   * Pre-computed class name for non-atomic mode (used by `cssMapScoped`).
   * Should be `NON_ATOMIC_CLASS_PREFIX + hash(filename + ':' + variantKey)`.
   * When provided, avoids hashing the full CSS content string.
   */
  nonAtomicClassName?: string;
};

/**
 * Splits a single item's styles into sheets and an expression that handles
 * className logic at runtime.
 *
 * @param item {CssItem}
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const transformCssItem = (
  item: CssItem,
  meta: Metadata,
  opts: TransformOptions = {}
): {
  sheets: string[];
  classExpression?: t.Expression;
} => {
  switch (item.type) {
    case 'conditional':
      const consequent = transformCssItem(item.consequent, meta, opts);
      const alternate = transformCssItem(item.alternate, meta, opts);
      const defaultExpression = t.identifier('undefined');
      const hasConsequentSheets = Boolean(consequent.sheets.length);
      const hasAlternateSheets = Boolean(alternate.sheets.length);

      if (!hasConsequentSheets && !hasAlternateSheets) {
        return { sheets: [], classExpression: undefined };
      }

      if (!hasConsequentSheets || !hasAlternateSheets) {
        const classExpression = hasConsequentSheets
          ? consequent.classExpression
          : alternate.classExpression;

        return {
          sheets: hasConsequentSheets ? consequent.sheets : alternate.sheets,
          classExpression: t.logicalExpression(
            '&&',
            hasConsequentSheets ? item.test : t.unaryExpression('!', item.test),
            classExpression || defaultExpression
          ),
        };
      }

      return {
        sheets: [...consequent.sheets, ...alternate.sheets],
        classExpression: t.conditionalExpression(
          item.test,
          consequent.classExpression || defaultExpression,
          alternate.classExpression || defaultExpression
        ),
      };

    case 'logical':
      const logicalCss = transformCss(getItemCss(item), meta.state.opts, opts);

      return {
        sheets: logicalCss.sheets,
        classExpression: t.logicalExpression(
          item.operator,
          item.expression,
          t.stringLiteral(
            compressClassNamesForRuntime(
              logicalCss.classNames,
              meta.state.opts.classNameCompressionMap
            ).join(' ')
          )
        ),
      };

    case 'map':
      return {
        sheets: meta.state.cssMap[item.name],
        classExpression: item.expression,
      };

    default:
      const css = transformCss(getItemCss(item), meta.state.opts, opts);
      const className = compressClassNamesForRuntime(
        css.classNames,
        meta.state.opts.classNameCompressionMap
      ).join(' ');

      return {
        sheets: css.sheets,
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
  cssItems: CssItem[],
  meta: Metadata,
  opts: TransformOptions = {}
): { sheets: string[]; classNames: t.Expression[] } => {
  // In non-atomic mode, all CSS items for a variant must be combined into a single
  // CSS string and transformed together so that exactly ONE class name is generated.
  // This is required because a variant may produce multiple CssItems (e.g. a
  // @keyframes item + a declaration item when keyframes() is used), and without
  // combining them each item would get its own cc- hash — violating the invariant
  // that non-atomic cssMap variants produce a single class.
  if (opts.atomic === false) {
    // Collect all unconditional CSS text from the items, ignoring conditional/map items.
    // Conditional items (ternary) are handled by the cssMap compiler upstream before
    // reaching here — each variant's items are always unconditional at this point.
    const combinedCss = cssItems
      .filter((item) => item.type !== 'conditional' && item.type !== 'map')
      .map((item) => getItemCss(item))
      .join('\n');

    const css = transformCss(combinedCss, meta.state.opts, {
      atomic: opts.atomic,
      nonAtomicClassName: opts.nonAtomicClassName,
    });
    // Collapse all sheets for this variant into a single string:
    // - Emits exactly one `const _N` variable per variant in the babel output
    // - Results in exactly one insertNonAtomicRule() call at runtime → fewer DOM mutations
    const sheets = css.sheets.length > 1 ? [css.sheets.join('')] : css.sheets;
    const className = compressClassNamesForRuntime(
      css.classNames,
      meta.state.opts.classNameCompressionMap
    ).join(' ');

    return {
      sheets,
      classNames: className.trim() ? [t.stringLiteral(className)] : [],
    };
  }

  const sheets: string[] = [];
  const classNames: t.Expression[] = [];

  cssItems.forEach((item) => {
    const result = transformCssItem(item, meta, opts);

    sheets.push(...result.sheets);
    if (result.classExpression) {
      classNames.push(result.classExpression);
    }
  });

  return { sheets, classNames };
};

/**
 * Wraps CSS within a CssItem around selector closures. Each subsequent selector
 * in the selectors array represents a nested selector.
 *
 * @param item {CssItem}
 * @param selectors {string[]}
 */
export const applySelectors = (item: CssItem, selectors: string[]): void => {
  if (item.type === 'conditional') {
    applySelectors(item.consequent, selectors);
    applySelectors(item.alternate, selectors);
  } else {
    item.css = `${selectors.join('')}${item.css}${''.padEnd(selectors.length, '}')}`;
  }
};
