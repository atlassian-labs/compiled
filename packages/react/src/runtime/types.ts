import type { Depths } from '@compiled/utils';

export interface StyleSheetOpts {
  /**
   * Used to set a nonce on the style element.
   * This is needed when using a strict CSP and should be a random hash generated every server load.
   * Check out https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src for more information.
   */
  nonce?: string;
  /**
   * A unique key identifying the style container. Used to namespace the
   * deduplication cache so styles inserted into a custom container (e.g. a
   * Shadow DOM) are tracked independently from the main document cache.
   *
   * Must be provided together with `container`.
   */
  cacheKey?: string;
  /**
   * A DOM node into which Compiled will insert `<style>` elements instead of
   * `document.head`. Useful when rendering inside a Shadow DOM where styles in
   * the main document head are not visible to the shadow tree.
   *
   * Must be provided together with `cacheKey`.
   */
  container?: HTMLElement | ShadowRoot;
}

/**
 * Buckets under which we will group our stylesheets
 */
export type Bucket =
  // shorthand properties
  | `s-${Depths}`
  // catch-all
  | ''
  // link
  | 'l'
  // visited
  | 'v'
  // focus-within
  | 'w'
  // focus
  | 'f'
  // focus-visible
  | 'i'
  // hover
  | 'h'
  // active
  | 'a'
  // at-rules
  | 'm';

export type UseCacheHook = () => Record<string, true>;

export type ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) => JSX.Element;
