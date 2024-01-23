---
'@compiled/react': patch
---

Add `ElementType` to the Compiled JSX namespace. This is needed to ensure types are the same in the Compiled JSX namspace and the default React one, such as returning `undefined`, `string`, and other freshly valid types.
