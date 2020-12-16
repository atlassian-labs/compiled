import { plugin } from 'postcss';
import { parse } from 'postcss-values-parser';
import { ConversionFunction } from './types';
import { margin } from './margin';
import { padding } from './padding';
import { placeContent } from './place-content';
import { placeItems } from './place-items';
import { placeSelf } from './place-self';
import { overflow } from './overflow';
import { flex } from './flex';
import { flexFlow } from './flex-flow';
import { outline } from './outline';
import { textDecoration } from './text-decoration';
import { background } from './background';
import { order } from './order';

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

  // These properties are partially expanded (and ordered otherwise)
  background,

  // These properties are ordered only but may be expanded later.
  'column-rule': order,
  'list-style': order,
  columns: order,
  border: order,
  borderTop: order,
  borderRight: order,
  borderLeft: order,
  borderBottom: order,

  // These properties are excluded for now
  /**
   * border-color
   * border-radius
   * border-style
   * border-width
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

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const expandShorthands = plugin('expand-shorthands', () => {
  const filter = new RegExp(Object.keys(shorthands).join('|'));

  return (root) => {
    root.walkDecls(filter, (decl) => {
      const valueNode = parse(decl.value);
      const expand = shorthands[decl.prop];

      if (expand) {
        const longforms = expand(valueNode);
        if (!longforms) {
          throw new Error('Longform properties were not returned!');
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
      }
    });
  };
});
