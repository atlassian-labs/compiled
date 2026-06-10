/**
 * Shared at-rule classification lists used by both `atomicify-rules` and
 * `non-atomicify-rules` to determine how to handle each at-rule type.
 *
 * Keep this in sync with the CSS spec and any new at-rules Compiled supports.
 */

/**
 * At-rules whose child rules CAN be scoped under a generated class name.
 * e.g. `@media`, `@supports`, `@container`.
 */
export const SCOPEABLE_AT_RULES = [
  'container',
  '-moz-document',
  'else',
  'layer',
  'media',
  'starting-style',
  'supports',
  'when',
] as const;

/**
 * At-rules whose inner content must NOT be rewritten with a class selector.
 * Their child "rules" are not element selectors — e.g. `@keyframes` stops
 * (from/to/0%) are keyframe selectors, and `@font-face` / `@property` /
 * `@counter-style` are global descriptors.
 */
export const PASSTHROUGH_AT_RULES = [
  'color-profile',
  'counter-style',
  'font-face',
  'font-palette-values',
  'keyframes',
  'page',
  'position-try',
  'property',
] as const;

/**
 * At-rules that are never valid inside a CSS rule and should throw an error.
 */
export const FORBIDDEN_AT_RULES = ['charset', 'import', 'namespace'] as const;
