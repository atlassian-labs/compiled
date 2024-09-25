/*
 * Hacky script for finding the bucket number for each shorthand property, such that
 * the minimum number of buckets are needed to ensure that overlapping shorthand
 * properties are in separate buckets.
 *
 * How to run:
 * npx ts-node packages/scripts/src/generate-shorthand.ts
 *
 * Then copy the console output to the `shorthandBuckets` variable in
 * `packages/react/src/runtime/shorthand.ts` and
 * `packages/utils/src/shorthand.ts`
 */

import { shorthandFor, type ShorthandProperties } from '@compiled/utils';

const buckets: Record<string, number> = {};

type LonghandProperties = string;

const flattenedShorthandFor: [ShorthandProperties, LonghandProperties][] = [];

for (const [shorthand, longhands] of Object.entries(shorthandFor)) {
  if (longhands === true) {
    // If longhands === true, then we assume that this shorthand property should come
    // before every other property
    //
    // (currently only applies to the `all` property)
    buckets[shorthand] = 0;
    continue;
  }

  buckets[shorthand] = 1;
  for (const longhand of longhands) {
    flattenedShorthandFor.push([shorthand as ShorthandProperties, longhand]);
  }
}

const incomingEdges: Record<LonghandProperties, ShorthandProperties[]> = {};

for (const [shorthand, longhand] of flattenedShorthandFor) {
  if (!(longhand in incomingEdges)) {
    incomingEdges[longhand] = [];
  }
  incomingEdges[longhand].push(shorthand);
}

// Iterate over all the shorthand properties that correspond to each longhand property, and
// ensure they have a unique bucket number higher than the previous shorthand property.
//
// For example, for the longhand property `borderTopColor`, we want the `border` shorthand
// property to come before `borderColor`, which comes before `borderTop`. So we might assign
// the bucket numbers 1, 2, and 3...... though in reality, there are many more border-related
// shorthand properties so this ends up being 1, 6, and 12 :(

for (const [, shorthands] of Object.entries(incomingEdges)) {
  for (let i = 1; i < shorthands.length; i++) {
    const prev = shorthands[i - 1];
    const current = shorthands[i];

    if (buckets[prev] >= buckets[current]) {
      buckets[current] = buckets[prev] + 1;
    }
  }
}

// Check whether the calculated buckets are correct

for (const [shorthand, longhands] of Object.entries(shorthandFor)) {
  if (longhands === true) {
    // Skip checking `all`
    continue;
  }
  for (const longhand of longhands) {
    const shorthandDepth = buckets[shorthand];
    const longhandDepth = buckets[longhand] ?? Infinity;
    if (shorthandDepth >= longhandDepth) {
      throw new Error(
        `ERROR: Depth of ${shorthand} is not lower than depth of ${longhand}. This is likely a bug!`
      );
    }
  }
}

// Return calculated depths.

console.log('Calculated buckets:\n');
console.log(JSON.stringify(buckets), '\n');
console.log(
  'Copy the above object to the `shorthandBuckets` variable in `packages/react/src/runtime/shorthand.ts` and `packages/utils/src/shorthand.ts`'
);
