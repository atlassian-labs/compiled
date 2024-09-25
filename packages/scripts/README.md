# scripts

Miscellaneous scripts used internally for Compiled development.

## `generate-shorthand`

```
npx ts-node packages/scripts/src/generate-shorthand.ts
```

Using the shorthand property information in `shorthandFor`, this script generates the expected value of `shorthandBuckets`, i.e. what bucket number each shorthand property value should be assigned such that overlapping CSS shorthand properties are ordered deterministically. This is printed to the console, where you can then copy-paste the output to the `shorthandBuckets` variables in `packages/react/src/runtime/shorthand.ts` and `packages/utils/src/shorthand.ts`.

(Overlapping CSS shorthand properties are shorthand properties that can be used to set the same longhand property. For example, `border`, `borderColor`, and `borderTop` can all be used to set the value of `borderTopColor`.)
