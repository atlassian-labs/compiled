import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/place-items
 */
export const placeItems: ConversionFunction = (node, value) => {
  const [alignItems, justifyItems = alignItems] = value.nodes;

  return [
    node.clone({ prop: 'align-items', value: alignItems }),
    node.clone({ prop: 'justify-items', value: justifyItems }),
  ];
};
