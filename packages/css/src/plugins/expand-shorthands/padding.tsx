import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/padding
 */
export const padding: ConversionFunction = (node, value) => {
  const [top, right = top, bottom = top, left = right] = value.nodes;

  return [
    node.clone({ prop: 'padding-top', value: top }),
    node.clone({ prop: 'padding-right', value: right }),
    node.clone({ prop: 'padding-bottom', value: bottom }),
    node.clone({ prop: 'padding-left', value: left }),
  ];
};
