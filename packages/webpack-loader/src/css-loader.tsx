import { URLSearchParams } from 'url';

import type { LoaderContext } from 'webpack';

/**
 * CSSLoader will take the style query params added by `./compiled-loader.tsx` and turn it into CSS.
 */
export default function CSSLoader(this: LoaderContext<void>): string {
  const query = new URLSearchParams(this.resourceQuery);
  const styleRule = query.get('style');
  return styleRule || '';
}

/**
 * Moves CSSloader to the end of the loader queue so it runs first.
 */
export function pitch(this: LoaderContext<void>): void {
  if (this.loaders[0].pitch !== pitch) {
    // If the first loader isn't this one - skip.
    return;
  }

  // The first loader is Compiled's css-loader - we need to shift
  // it to be at the end of the loader chain so it runs first (instead of last).
  const firstLoader = this.loaders.shift();
  this.loaders.push(firstLoader!);
}
