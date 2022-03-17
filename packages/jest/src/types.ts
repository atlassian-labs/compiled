import type { Pseudos } from 'csstype';

/**
 * {} is used to enabled the compiler to not reduce Target down to a string.
 * This keeps both Pseduos intellisense working as well as then allowing us to define anything.
 * See: https://github.com/microsoft/TypeScript/issues/29729#issuecomment-460346421
 */
type AnyTarget = string & { _?: never };
type Target = Pseudos | AnyTarget;

export interface MatchFilter {
  target?: Target;
  media?: string;
}
