import type { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/place-items
 */
export const placeItems: ConversionFunction = (value) => {
  const [alignItems, justifyItems = alignItems] = value.nodes;

  return [
    { prop: 'align-items', value: alignItems.toString() },
    { prop: 'justify-items', value: justifyItems.toString() },
  ];
};
