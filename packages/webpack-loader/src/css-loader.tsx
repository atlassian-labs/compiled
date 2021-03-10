import { URLSearchParams } from 'url';

/**
 * CSSLoader will take the query params and turn it into CSS.
 *
 * @param {string} source
 */
export default function CSSLoader(this: any): string {
  const query = new URLSearchParams(this.resourceQuery);
  const styleRule = query.get('style');

  console.log(styleRule);

  return `

  `;
}

/**
 * Move the atomic loader to the end of the loader queue
 */
export function pitch(this: any) {
  if (this.loaders[0].path !== __filename) {
    return;
  }

  const firstLoader = this.loaders.shift();
  this.loaders.push(firstLoader);
}
