/**
 * Ordered style buckets using the long pseudo-selector.
 *
 * If changed, make sure that it aligns with the definition in `packages/react/src/runtime/sheet.ts`.
 */
export const styleOrder: readonly string[] = [
  ':link',
  ':visited',
  ':focus-within',
  ':focus',
  ':focus-visible',
  ':hover',
  ':active',
];
