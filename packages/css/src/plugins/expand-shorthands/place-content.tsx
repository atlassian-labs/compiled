import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/place-content
 */
export const placeContent: ConversionFunction = (node, value) => {
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
};
