import { plugin, Declaration } from 'postcss';
import { parse, Node, Root as ValuesRoot } from 'postcss-values-parser';

type ConversionFunction = (node: Declaration, value: ValuesRoot) => Declaration[];

const globalValues = ['inherit', 'initial', 'unset'];
const directionValues = [...globalValues, 'row', 'row-reverse', 'column', 'column-reverse'];
const wrapValues = [...globalValues, 'nowrap', 'wrap', 'reverse'];
const sizeValues = ['thin', 'medium', 'thick'];
const styleValues = [
  ...globalValues,
  'auto',
  'none',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
];

const shorthands: Record<string, ConversionFunction> = {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/margin
   */
  margin: (node, value) => {
    const [top, right = top, bottom = top, left = right] = value.nodes;

    return [
      node.clone({ prop: 'margin-top', value: top }),
      node.clone({ prop: 'margin-right', value: right }),
      node.clone({ prop: 'margin-bottom', value: bottom }),
      node.clone({ prop: 'margin-left', value: left }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/padding
   */
  padding: (node, value) => {
    const [top, right = top, bottom = top, left = right] = value.nodes;

    return [
      node.clone({ prop: 'padding-top', value: top }),
      node.clone({ prop: 'padding-right', value: right }),
      node.clone({ prop: 'padding-bottom', value: bottom }),
      node.clone({ prop: 'padding-left', value: left }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/place-content
   */
  'place-content': (node, value) => {
    const [alignContent, justifyContent] = value.nodes;
    if (!justifyContent && alignContent.type === 'word') {
      if (['left', 'right', 'baseline'].includes(alignContent.value)) {
        // The spec says that if we use a single value and its invalid in one
        // of the two longform properties it should be invalidated.
        // See: https://developer.mozilla.org/en-US/docs/Web/CSS/place-content
        return [];
      }
    }

    return [
      node.clone({ prop: 'align-content', value: alignContent }),
      node.clone({ prop: 'justify-content', value: justifyContent || alignContent }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/place-items
   */
  'place-items': (node, value) => {
    const [alignItems, justifyItems = alignItems] = value.nodes;

    return [
      node.clone({ prop: 'align-items', value: alignItems }),
      node.clone({ prop: 'justify-items', value: justifyItems }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/place-self
   */
  'place-self': (node, value) => {
    const [alignSelf, justifySelf = alignSelf] = value.nodes;

    return [
      node.clone({ prop: 'align-self', value: alignSelf }),
      node.clone({ prop: 'justify-self', value: justifySelf }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
   */
  overflow: (node, value) => {
    const [overflowX, overflowY = overflowX] = value.nodes;

    return [
      node.clone({ prop: 'overflow-x', value: overflowX }),
      node.clone({ prop: 'overflow-y', value: overflowY }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/flex-flow
   */
  'flex-flow': (node, value) => {
    const [left, right] = value.nodes;
    let directionValue = '';
    let wrapValue = '';

    /**
     * Extracts values from a node and mutates variables in scope.
     * If it returns `true` we should bail out and return no nodes.
     *
     * @param node
     */
    const extactValues = (node: Node): boolean => {
      if (node && node.type === 'word') {
        if (directionValues.includes(node.value)) {
          if (directionValue !== '') {
            // Invalid - already set!
            return true;
          }

          directionValue = node.value;
        } else if (wrapValues.includes(node.value)) {
          if (wrapValue !== '') {
            // Invalid - already set!
            return true;
          }

          wrapValue = node.value;
        } else {
          // Invalid
          return true;
        }
      }

      return false;
    };

    if (extactValues(left) || extactValues(right)) {
      return [];
    }

    return [
      node.clone({ prop: 'flex-direction', value: directionValue || 'initial' }),
      node.clone({ prop: 'flex-wrap', value: wrapValue || 'initial' }),
    ];
  },
  /**
   * https://developer.mozilla.org/en-US/docs/Web/CSS/outline
   */
  outline: (node, value) => {
    const [left, middle, right] = value.nodes;
    let colorValue: Node | string = '';
    let styleValue: Node | string = '';
    let widthValue: Node | string = '';

    /**
     * Extracts values from a node and mutates variables in scope.
     * If it returns `true` we should bail out and return no nodes.
     *
     * @param node
     */
    const extractValues = (node: Node): boolean => {
      if (node && node.type === 'word') {
        if (node.isColor) {
          if (colorValue !== '') {
            // It has already been set - invalid!
            return true;
          }

          colorValue = node.value;
        } else if (sizeValues.includes(node.value)) {
          if (widthValue !== '') {
            // It has already been set - invalid!
            return true;
          }

          widthValue = node.value;
        } else if (styleValues.includes(node.value)) {
          if (styleValue !== '') {
            // It has already been set - invalid!
            return true;
          }

          styleValue = node.value;
        } else {
          // Invalid
          return true;
        }
      } else if (node && node.type === 'numeric') {
        if (widthValue !== '') {
          // It has already been set - invalid!
          return true;
        }

        widthValue = node;
      }

      return false;
    };

    if (extractValues(left) || extractValues(middle) || extractValues(right)) {
      return [];
    }

    return [
      node.clone({ prop: 'outline-color', value: colorValue || 'initial' }),
      node.clone({ prop: 'outline-style', value: styleValue || 'initial' }),
      node.clone({ prop: 'outline-width', value: widthValue || 'initial' }),
    ];
  },
};

/**
 * PostCSS plugin that expands shortform properties to their longform equivalents.
 */
export const propertyExpander = plugin('property-expander', () => {
  const filter = new RegExp(Object.keys(shorthands).join('|'));

  return (root) => {
    root.walkDecls(filter, (decl) => {
      const valueNode = parse(decl.value);
      const convert = shorthands[decl.prop];

      if (convert) {
        const longforms = convert(decl, valueNode);
        if (!longforms) {
          throw new Error('Longform properties were not returned!');
        }

        decl.parent.insertBefore(decl, longforms);
        decl.remove();
      }
    });
  };
});
