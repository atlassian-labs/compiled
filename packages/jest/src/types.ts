import type { Pseudos } from 'csstype';

/**
 * {} is used to enabled the compiler to not reduce Target down to a string.
 * This keeps both Pseduos intellisense working as well as then allowing us to define anything.
 * See: https://github.com/microsoft/TypeScript/issues/29729#issuecomment-460346421
 */
type AnyTarget = string & { _?: never };
type Target = Pseudos | AnyTarget;

export interface MatchFilter {
  /**
   * Pseudo-class, pseudo-element or nested selector the style is applied to, e.g. `:hover`.
   */
  target?: Target;
  /**
   * Condition of the innermost `@media` rule the style is nested in, e.g. `(min-width: 300px)`.
   */
  media?: string;
  /**
   * Prelude of the innermost `@container` rule the style is nested in, including the
   * container name when there is one, e.g. `(width > 400px)` or `sidebar (min-width: 300px)`.
   */
  container?: string;
  /**
   * Condition of the innermost `@supports` rule the style is nested in, e.g. `(display: grid)`.
   */
  supports?: string;
  /**
   * Full name of the cascade layer the style is nested in. Nested layers are joined with
   * a dot, so `@layer base { @layer reset { ... } }` is matched with `base.reset`.
   */
  layer?: string;
  /**
   * Set to `true` to match styles nested in a `@starting-style` block.
   */
  startingStyle?: boolean;
}
