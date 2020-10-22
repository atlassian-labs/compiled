import { StyleSheetOpts, Bucket } from './types';

/**
 * Get style element sheet
 *
 * @param styleElement Style element like <style></style>
 */
export function getStyleElementSheet(styleElement: HTMLStyleElement | undefined): CSSStyleSheet {
  // @ts-ignore - We assume it will return a sheet so coerce it to CSSStyleSheet.
  return styleElement && (styleElement.sheet as CSSStyleSheet);
}

/**
 * Create style element and add attributes to it
 *
 * @param opts StyleSheetOpts
 * @param bucket Bucket
 */
export function createStyleElement(opts: StyleSheetOpts, bucket: Bucket): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  bucket && tag.setAttribute('data-c', bucket);
  tag.appendChild(document.createTextNode(''));
  return tag;
}

/**
 * Appends css to style element if its present by creating a text node
 *
 * @param styleElement Style element like <style></style>
 * @param css css in string form like ._a1234567{display: block;}
 */
export function appendCSSTextNode(styleElement: HTMLStyleElement | undefined, css: string) {
  styleElement && styleElement.appendChild(document.createTextNode(css));
}
