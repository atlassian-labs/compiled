import { StyleSheetOpts, Bucket } from './types';

export function getStyleElementSheet(styleElement: HTMLStyleElement | undefined): CSSStyleSheet {
  // @ts-ignore - We assume it will return a sheet so coerce it to CSSStyleSheet.
  return styleElement && (styleElement.sheet as CSSStyleSheet);
}

export function createStyleElement(opts: StyleSheetOpts, bucket: Bucket): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  bucket && tag.setAttribute('data-c', bucket);
  tag.appendChild(document.createTextNode(''));
  return tag;
}

export function appendCSSTextNode(styleElement: HTMLStyleElement | undefined, css: string) {
  styleElement && styleElement.appendChild(document.createTextNode(css));
}
