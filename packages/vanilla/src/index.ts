/**
 * `@compiled/vanilla` — framework-agnostic compile-time CSS-in-JS for Compiled.
 *
 * This package exposes a small surface intended for non-React code paths:
 * - {@link cssMap} for declaring style maps that resolve to className strings
 * - {@link ax} for merging className strings with last-wins atomic dedup
 *
 * All other transformations (`<CC>` / `<CS>` injection, JSX runtime, the css
 * prop, `styled`, etc.) live in `@compiled/react` and are React-specific.
 */
export { default as cssMap } from './css-map/index';
export { ax } from './runtime';

// Re-export the type primitives so consumers writing helper utilities (e.g.
// "build a style object then pass it to cssMap") have access to the same
// types the public API uses, without reaching into private subpaths.
export type { CssFunction, CssObject, CSSProps, CssType } from './types';
