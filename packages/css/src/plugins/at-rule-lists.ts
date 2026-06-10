/**
 * Shared at-rule classification lists and utilities used by both `atomicify-rules`
 * and `non-atomicify-rules` to determine how to handle each at-rule type.
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

export type AtRuleKind = 'scopeable' | 'passthrough' | 'forbidden' | 'unknown';

const SCOPEABLE_SET = new Set<string>(SCOPEABLE_AT_RULES);
const PASSTHROUGH_SET = new Set<string>(PASSTHROUGH_AT_RULES);
const FORBIDDEN_SET = new Set<string>(FORBIDDEN_AT_RULES);

/**
 * Classifies an at-rule name into one of four categories:
 * - `'scopeable'`  — inner rules should be scoped under a generated class (e.g. @media)
 * - `'passthrough'` — inner content must NOT be prefixed (e.g. @keyframes, @property)
 * - `'forbidden'`  — cannot appear inside CSS rules, should throw (e.g. @charset)
 * - `'unknown'`    — not recognised; callers may throw or warn as appropriate
 *
 * This is the shared implementation of `canAtomicifyAtRule` from `atomicify-rules.ts`,
 * extracted so that `non-atomicify-rules.ts` uses the same classification logic.
 */
export const classifyAtRule = (name: string): AtRuleKind => {
  if (SCOPEABLE_SET.has(name)) return 'scopeable';
  if (PASSTHROUGH_SET.has(name)) return 'passthrough';
  if (FORBIDDEN_SET.has(name)) return 'forbidden';
  return 'unknown';
};
