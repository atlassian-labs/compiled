import type { Plugin } from 'postcss';
import { parse, type ChildNode } from 'postcss-values-parser';

import { background } from './background';
import { flex } from './flex';
import { flexFlow } from './flex-flow';
import { margin } from './margin';
import { outline } from './outline';
import { overflow } from './overflow';
import { padding } from './padding';
import { placeContent } from './place-content';
import { placeItems } from './place-items';
import { placeSelf } from './place-self';
import { textDecoration } from './text-decoration';
import type { ConversionFunction } from './types';

const shorthands: Record<string, ConversionFunction> = {
  // These properties are fully expanded
  margin,
  padding,
  'place-content': placeContent,
  'place-items': placeItems,
  'place-self': placeSelf,
  overflow,
  flex,
  'flex-flow': flexFlow,
  outline,
  'text-decoration': textDecoration,

  // These properties are partially expanded
  background,

  // These properties are excluded for now but will be ordered when building production.
  /**
   * border
   * border-top
   * border-right
   * border-left
   * border-bottom
   * border-color
   * border-radius
   * border-style
   * border-width
   * column-rule'
   * list-style'
   * columns
   * animation
   * transition
   * font
   * grid-column
   * grid-row
   * grid-template
   * grid
   * grid-area
   * offset
   */
};

const valueIsNotSafeToExpand = (node: ChildNode): boolean => {
  // This is the case where a CSS variable is given as the value, e.g.
  // `padding: var(--_fl6vf6)`. Value of _fl6vf6 is unknown, so this
  // cannot be expanded safely.
  //
  // https://github.com/atlassian-labs/compiled/issues/1331
  return node.type === 'func' && node.isVar;
};

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const expandShorthands = (): Plugin => {
  return {
    postcssPlugin: 'expand-shorthands',
    Declaration(decl) {
      const expand = shorthands[decl.prop];
      /** Return early if no matching property to expand */
      if (!expand) {
        return;
      }

      const valueNode = parse(decl.value);
      if (valueNode.nodes.some(valueIsNotSafeToExpand)) {
        return;
      }

      const longforms = expand(valueNode);
      if (!longforms) {
        throw new Error('Longform properties were not returned!');
      }

      /** Return early if not replacing a node */
      if (longforms.length === 1 && longforms[0].prop === undefined) {
        return;
      }

      const nodes = longforms.map((val) => {
        const newNode = decl.clone({
          ...val,
          // Value needs to be a string else autoprefixer blows up.
          value: `${val.value}`,
        });
        return newNode;
      });

      decl.replaceWith(nodes);
    },
  };
};

export const postcss = true;
