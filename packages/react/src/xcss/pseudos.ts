import type { Pseudos as CSSPseudos } from 'csstype';
// List of pseudo-classes and pseudo-elements are from csstype
// but with & added in the front, so that we target the current element
// (instead of a child element)
type SafePseudos = Exclude<
  // Exclude anything that requires an argument
  CSSPseudos,
  | ':not'
  | ':nth-child'
  | ':nth-last-child'
  | ':nth-last-of-type'
  | ':nth-of-type'
  | ':has'
  | ':host'
  | ':host-context'
> &
  // Exclude anything that requires information from outside of the current element
  Exclude<
    CSSPseudos,
    | ':first-child'
    | ':first-of-type'
    | ':last-child'
    | ':last-of-type'
    | ':only-child'
    | ':only-of-type'
  >;
export type Pseudos = { [Pseudo in SafePseudos]: `&${Pseudo}` }[SafePseudos];
