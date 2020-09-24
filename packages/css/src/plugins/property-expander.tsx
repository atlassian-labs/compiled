import { plugin, Declaration } from 'postcss';
import { parse, Root as ValuesRoot } from 'postcss-values-parser';

type ConversionFunction = (node: Declaration, value: ValuesRoot) => Declaration[];

const shorthands: Record<string, ConversionFunction> = {
  margin: (node, value) => {
    const [top, right = top, bottom = top, left = right] = value.nodes;

    return [
      node.clone({ prop: 'margin-top', value: top }),
      node.clone({ prop: 'margin-right', value: right }),
      node.clone({ prop: 'margin-bottom', value: bottom }),
      node.clone({ prop: 'margin-left', value: left }),
    ];
  },
};

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const propertyExpander = plugin('property-expander', () => {
  return (root) => {
    root.walkDecls(Object.keys(shorthands).join('|'), (decl) => {
      const valueNode = parse(decl.value);
      const convert = shorthands[decl.prop];

      if (convert) {
        const longforms = convert(decl, valueNode);
        decl.parent.insertBefore(decl, longforms);
        decl.remove();
      }
    });
  };
});
