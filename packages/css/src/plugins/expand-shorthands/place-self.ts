import type { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/place-self
 */
export const placeSelf: ConversionFunction = (value) => {
  const [alignSelf, justifySelf = alignSelf] = value.nodes;

  return [
    { prop: 'align-self', value: alignSelf.toString() },
    { prop: 'justify-self', value: justifySelf.toString() },
  ];
};
