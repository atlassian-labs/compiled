import { plugin, Declaration } from 'postcss';
import { parse, Root as ValuesRoot } from 'postcss-values-parser';

type ConversionFunction = (node: Declaration, value: ValuesRoot) => Declaration[];

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
    const directionValues = ['row', 'row-reverse', 'column', 'column-reverse'];
    const wrapValues = ['nowrap', 'wrap', 'reverse'];
    let directionValue = 'row';
    let wrapValue = 'nowrap';

    if (left && left.type === 'word') {
      if (directionValues.includes(left.value)) {
        directionValue = left.value;
      } else if (wrapValues.includes(left.value)) {
        wrapValue = left.value;
      } else {
        // Invalid
        return [];
      }
    }

    if (right && right.type === 'word') {
      if (directionValues.includes(right.value)) {
        directionValue = right.value;
      } else if (wrapValues.includes(right.value)) {
        wrapValue = right.value;
      } else {
        // Invalid
        return [];
      }
    }

    return [
      node.clone({ prop: 'flex-direction', value: directionValue }),
      node.clone({ prop: 'flex-wrap', value: wrapValue }),
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
        decl.parent.insertBefore(decl, longforms);
        decl.remove();
      }
    });
  };
});
