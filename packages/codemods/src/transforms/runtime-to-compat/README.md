# runtime-to-compat

Rewrites manual runtime imports from `@compiled/react/runtime` to `@compiled/react/compat-runtime`.

This is intended for the staged migration flow where the compiler/bundler has already been switched to
`outputMode: 'compat'`, and you want any handwritten runtime imports to follow the same behavior-preserving
compat entrypoint.
