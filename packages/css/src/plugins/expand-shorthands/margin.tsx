import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/margin
 */
export const margin: ConversionFunction = (node, value) => {
  const [top, right = top, bottom = top, left = right] = value.nodes;

  return [
    node.clone({ prop: 'margin-top', value: top }),
    node.clone({ prop: 'margin-right', value: right }),
    node.clone({ prop: 'margin-bottom', value: bottom }),
    node.clone({ prop: 'margin-left', value: left }),
  ];
};
