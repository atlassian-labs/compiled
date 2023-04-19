// Ensure only one `@compiled/runtime` exist in the bundle.
// This is because `ac` and `style-cache` need to access a singlton.
if (typeof window !== 'undefined') {
  if (typeof window.__COMPILED_IMPORTED__ !== 'undefined') {
    throw new Error(
      'Multiple instances of Compiled Runtime have been found on the page. A likely cause is that muliple versions of `@compiled/react` exist in JS bundle.'
    );
  }
  window.__COMPILED_IMPORTED__ = true;
}
