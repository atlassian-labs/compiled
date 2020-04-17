import { StyleSheetOpts } from './types';

// @ts-ignore - potentially returning undefined by ignorign to save kb.
function sheetForTag(tag: HTMLStyleElement): CSSStyleSheet {
  if (tag.sheet) {
    return tag.sheet as CSSStyleSheet;
  }

  // this weirdness brought to you by firefox
  for (let i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
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
  const speedy = opts.speedy || process.env.NODE_ENV === 'production';
  let tags: HTMLStyleElement[] = [];
  let tagCount = 0;

  return {
    insert(css: string) {
      // the max length is how many rules we have per style tag, it's 65000 in speedy mode
      // it's 1 in dev because we insert source maps that map a single rule to a location
      // and you can only have one source map per style tag
      if (tagCount % (speedy ? 65000 : 1) === 0) {
        let tag = createStyleElement(opts);
        let beforeElement: ChildNode | null =
          tags.length === 0 ? null : tags[tags.length - 1].nextSibling;

        document.head.insertBefore(tag, beforeElement);
        tags.push(tag);
      }

      const latestTag = tags[tags.length - 1];

      if (speedy) {
        const sheet = sheetForTag(latestTag);

        try {
          // this is a really hot path
          // we check the second character first because having "i"
          // as the second character will happen less often than
          // having "@" as the first character
          let isImportRule = css.charCodeAt(1) === 105 && css.charCodeAt(0) === 64;
          // this is the ultrafast version, works across browsers
          // the big drawback is that the css won't be editable in devtools
          sheet.insertRule(
            css,
            // we need to insert @import rules before anything else
            // otherwise there will be an error
            // technically this means that the @import rules will
            // _usually_(not always since there could be multiple style tags)
            // be the first ones in prod and generally later in dev
            // this shouldn't really matter in the real world though
            // @import is generally only used for font faces from google fonts and etc.
            // so while this could be technically correct then it would be slower and larger
            // for a tiny bit of correctness that won't matter in the real world
            isImportRule ? 0 : sheet.cssRules.length
          );
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`There was a problem inserting the following rule: "${css}"`, e);
          }
        }
      } else {
        latestTag.appendChild(document.createTextNode(css));
      }

      tagCount++;
    },
  };
};
