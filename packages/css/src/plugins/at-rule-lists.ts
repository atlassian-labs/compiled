/**
 * Shared at-rule classification constants used by both `atomicify-rules` and
 * `non-atomicify-rules` to determine how to handle each at-rule type.
 *
 * - `atomicify-rules` imports the raw constant arrays directly.
 * - `non-atomicify-rules` uses `canProcessAtRule` to determine passthrough vs scopeable at-rules.
 *
 * Keep these lists in sync with the CSS spec and any new at-rules Compiled supports.
 */

/**
 * At-rules that are allowed to be processed — their child rules can be
 * atomified or scoped under a generated class name.
 * e.g. `@media`, `@supports`, `@container`.
 */
export const ALLOWED_AT_RULES: string[] = [
  'container',
  '-moz-document',
  'else',
  'layer',
  'media',
  'starting-style',
  'supports',
  'when',
];

/**
 * At-rules whose inner content must NOT be rewritten with a class selector.
 * Their child "rules" are not element selectors — e.g. `@keyframes` stops
 * (from/to/0%) are keyframe selectors, and `@font-face` / `@property` /
 * `@counter-style` are global descriptors.
 */
export const PASSTHROUGH_AT_RULES: string[] = [
  'color-profile',
  'counter-style',
  'font-face',
  'font-palette-values',
  'keyframes',
  'page',
  'position-try',
  'property',
];

/**
 * At-rules that are never valid inside a CSS rule and should throw an error.
 */
export const FORBIDDEN_AT_RULES: string[] = ['charset', 'import', 'namespace'];

/**
 * Determines whether an at-rule can be processed (atomified or scoped) by
 * both `atomicify-rules` and `non-atomicify-rules`.
 *
 * Returns `true` if child rules should be processed under a generated class.
 * Returns `false` if the at-rule is a passthrough (e.g. `@keyframes`, `@property`).
 * Throws for forbidden at-rules (e.g. `@charset`) or unknown at-rules.
 */
export const canProcessAtRule = (name: string): boolean => {
  if (ALLOWED_AT_RULES.includes(name)) return true;
  if (FORBIDDEN_AT_RULES.includes(name))
    throw new Error(`At-rule '@${name}' cannot be used in CSS rules.`);
  if (!PASSTHROUGH_AT_RULES.includes(name)) throw new Error(`Unknown at-rule '@${name}'.`);
  // passthrough — @keyframes, @font-face, @property etc.
  return false;
};
