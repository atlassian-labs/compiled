import type * as CSS from 'csstype';

/**
 * Local copy of the type primitives used by `cssMap`. These mirror the types
 * in `@compiled/react/src/types.ts` but are intentionally duplicated here so
 * `@compiled/vanilla` does not take a *type-level* dependency on React.
 *
 * Why duplicate instead of re-export?
 * - The runtime dependency on `@compiled/react` is for `ax` and `insertRule`,
 *   both of which are used by emitted code. Pulling type symbols across the
 *   package boundary would force consumers to keep React's type definitions
 *   in scope even for files that never see React.
 * - Vanilla's `cssMap` returns `string` (a className), not the branded
 *   `CompiledStyles<...>` React uses for its css-prop / xcss flow. Keeping
 *   the input types local makes that distinction explicit.
 *
 * If these types ever drift from React's, the source of truth is
 * `packages/react/src/types.ts`. Keep the structural shape aligned so the
 * Babel plugin can apply the same `buildCss` pipeline to both modes without
 * special-casing.
 */

/**
 * Possible types for a CSS value inside an object expression.
 */
export type CssType =
  | CSSProps // Typed CSS properties
  | CssObject // Nested CSS object (selectors, pseudo-classes, media)
  | string; // Plain CSS string fragment (interpolated at build time)

/**
 * The set of CSS property declarations Compiled accepts as object keys.
 * Values are the standard `csstype`-typed property values plus the things
 * Compiled supports interpolating (numbers, strings, nested objects, etc.).
 */
export type CSSProps = Readonly<CSS.Properties<CssFunction>>;

/**
 * A nested CSS object. Keys are either CSS property names (e.g. `color`),
 * pseudo-class / pseudo-element selectors (e.g. `&:hover`), at-rule strings
 * (e.g. `@media (min-width: 600px)`), or plain selector strings.
 */
export type CssObject = Readonly<{
  [key: string]: CssFunction;
}>;

/**
 * The full set of values Compiled can statically evaluate as CSS at build
 * time. Mirrors `CssFunction` from `@compiled/react/types`.
 */
export type CssFunction =
  | CssType
  | number // Bare numeric values (e.g. `padding: 8`)
  | null
  | boolean // Allows short-circuit patterns like `condition && styles`
  | undefined;
