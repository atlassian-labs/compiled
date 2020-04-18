/**
 * Mostly ripped out of Emotion https://github.com/emotion-js/emotion and then heavily modified to be even smaller.
 * Thanks everyone who contributed in some form or another.
 */
import { StyleSheetOpts } from './types';

// @ts-ignore - potentially returning undefined by ignorign to save kb.
function getStyleElementSheet(styleElement: HTMLStyleElement): CSSStyleSheet {
  if (styleElement.sheet) {
    return styleElement.sheet as CSSStyleSheet;
  }

  // this weirdness brought to you by firefox
  for (let i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === styleElement) {
      return document.styleSheets[i] as CSSStyleSheet;
    }
  }
}

function createStyleElement(opts: StyleSheetOpts): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  tag.appendChild(document.createTextNode(''));
  return tag;
}

export const createStyleSheet = (opts: StyleSheetOpts) => {
  const speedy = opts.speedy || process.env.NODE_ENV === 'production',
    styleElements: HTMLStyleElement[] = [];
  let tagCount = 0;

  return (css: string) => {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (tagCount % (speedy ? 65000 : 1) === 0) {
      const newStyleElement = createStyleElement(opts);
      const elementToInsertBefore =
        styleElements.length === 0 ? null : styleElements[styleElements.length - 1].nextSibling;
      document.head.insertBefore(newStyleElement, elementToInsertBefore);
      styleElements.push(newStyleElement);
    }

    const latestStyleElement = styleElements[styleElements.length - 1];

    if (speedy) {
      const sheet = getStyleElementSheet(latestStyleElement);

      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools in most browsers.
        sheet.insertRule(css, sheet.cssRules.length);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/css-in-js - DEV WARNING

  There was a problem inserting the following rule: "${css}"`,
            e
          );
        }
      }
    } else {
      latestStyleElement.appendChild(document.createTextNode(css));
    }

    tagCount++;
  };
};
