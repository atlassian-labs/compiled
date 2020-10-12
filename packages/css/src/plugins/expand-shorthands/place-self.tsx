import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/place-self
 */
export const placeSelf: ConversionFunction = (node, value) => {
  const [alignSelf, justifySelf = alignSelf] = value.nodes;

  return [
    node.clone({ prop: 'align-self', value: alignSelf }),
    node.clone({ prop: 'justify-self', value: justifySelf }),
  ];
};
