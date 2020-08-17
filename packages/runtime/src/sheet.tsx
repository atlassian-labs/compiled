/**
 * Mostly ripped out of Emotion https://github.com/emotion-js/emotion and then heavily modified to be even smaller.
 * Thanks everyone who contributed in some form or another.
 */
import { StyleSheetOpts } from './types';

function getStyleElementSheet(styleElement: HTMLStyleElement): CSSStyleSheet {
  // @ts-ignore - We assume it will return a sheet so coerce it to CSSStyleSheet.
  return styleElement.sheet && (styleElement.sheet as CSSStyleSheet);
}

function createStyleElement(opts: StyleSheetOpts): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  tag.appendChild(document.createTextNode(''));
  return tag;
}

/**
 * Returns a style sheet object that is used to move styles to the head of the application
 * during runtime.
 *
 * @param opts StyleSheetOpts
 */
export const createStyleSheet = (opts: StyleSheetOpts) => {
  const speedy = process.env.NODE_ENV === 'production',
    styleElements: HTMLStyleElement[] = [];
  let tagCount = 0;

  return (css: string) => {
    // the max length is how many rules we have per style tag.
    // 1. it's 65000 in speedy mode
    // 2. it's 1 in dev because we insert source maps that map a single rule to a location
    //    and you can only have one source map per style tag
    if (tagCount % (speedy ? 65000 : 1) === 0) {
      const newStyleElement = createStyleElement(opts);
      const elementToInsertBefore =
        styleElements.length === 0 ? null : styleElements[styleElements.length - 1].nextSibling;
      document.head.insertBefore(newStyleElement, elementToInsertBefore);
      styleElements.push(newStyleElement);
    }

    if (speedy) {
      const sheet = getStyleElementSheet(styleElements[styleElements.length - 1]);
      // this is the ultrafast version, works across browsers
      // the big drawback is that the css won't be editable in devtools in most browsers.
      sheet.insertRule(css, sheet.cssRules.length);
    } else {
      styleElements[styleElements.length - 1].appendChild(document.createTextNode(css));
    }

    tagCount++;
  };
};
