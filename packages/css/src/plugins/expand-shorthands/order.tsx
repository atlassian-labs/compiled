import { ConversionFunction } from './types';

/**
 * Will order a nodes values.
 */
export const order: ConversionFunction = (value) => {
  const orderedValues = value.nodes
    .map((val) => val.toString())
    .sort()
    .join(' ');

  return [{ value: orderedValues }];
};
