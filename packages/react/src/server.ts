import { styleBucketOrdering } from './runtime/sheet';

// @ts-ignore
globalThis.compiledServerBuckets = styleBucketOrdering.reduce((acc, bucket) => {
  // @ts-ignore
  acc[bucket] = new Set();
  return acc;
}, {});

export const getServerStylesheet = (): string =>
  `<style data-cmpld="true">${styleBucketOrdering
    // @ts-ignore
    .map((bucket) => Array.from(globalThis.compiledServerBuckets[bucket]).join('\n'))
    .join('\n')}</style>`;
