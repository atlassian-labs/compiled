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

const shorthands: Record<string, ConversionFunction> = {
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
  background,
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
        const longforms = expand(decl, valueNode);
        if (!longforms) {
          throw new Error('Longform properties were not returned!');
        }

        decl.parent.insertBefore(decl, longforms);
        decl.remove();
      }
    });
  };
});
