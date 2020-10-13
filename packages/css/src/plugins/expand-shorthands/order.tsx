import { ConversionFunction } from './types';

/**
 * Will order a nodes values.
 */
export const order: ConversionFunction = (node, value) => {
  const orderedValues = value.nodes
    .map((val) => val.toString())
    .sort()
    .join(' ');

  return [
    node.clone({
      value: orderedValues,
    }),
  ];
};
