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
  padding: (node, value) => {
    const [top, right = top, bottom = top, left = right] = value.nodes;

    return [
      node.clone({ prop: 'padding-top', value: top }),
      node.clone({ prop: 'padding-right', value: right }),
      node.clone({ prop: 'padding-bottom', value: bottom }),
      node.clone({ prop: 'padding-left', value: left }),
    ];
  },
};

const filter = new RegExp(Object.keys(shorthands).join('|'));

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const propertyExpander = plugin('property-expander', () => {
  return (root) => {
    root.walkDecls(filter, (decl) => {
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
