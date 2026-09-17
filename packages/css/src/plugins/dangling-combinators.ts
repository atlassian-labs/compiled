import type { Plugin } from 'postcss';
import selectorParser from 'postcss-selector-parser';

/**
 * Dangling combinators PostCSS plugin.
 *
 * Throws a build error when a selector ends with a combinator, for example
 * `css({ '>': { marginLeft: 10 } })` or `css({ '& +': { ... } })`.
 * Without this check such rules make it into the stylesheet as `.hash > {}` — a selector
 * browsers reject, so the declarations silently never apply.
 * See https://github.com/atlassian-labs/compiled/issues/1751
 */
export const danglingCombinators = (): Plugin => {
  return {
    postcssPlugin: 'dangling-combinators',
    Once(root) {
      root.walkRules((rule) => {
        // A rule whose children are all nested rules is not dangling: postcss-nested joins its
        // selector onto each child, so `& > { .child { color: red } }` becomes `& > .child`.
        // Anything else — declarations, or an at-rule that bubbles and leaves the selector
        // behind — keeps the trailing combinator in the emitted rule.
        if (rule.every((node) => node.type === 'rule')) {
          return;
        }

        rule.selectors.forEach((selector) => {
          const trimmed = selector.trim();
          // A trailing combinator always leaves one of these characters last, so this cheap
          // test keeps the selector parser off the hot path for every other selector.
          if (!/[>+~|]$/.test(trimmed)) {
            return;
          }

          const last = selectorParser().astSync(trimmed, { lossless: false }).first?.last;
          if (last && last.type === 'combinator') {
            throw rule.error(
              `Dangling combinator '${last.value.trim()}' in selector '${trimmed}'. ` +
                `A combinator must be followed by a selector, e.g. '${trimmed} *' or '${trimmed} .child'. ` +
                `Compiled would otherwise emit '${trimmed} { ... }', which browsers ignore.`
            );
          }
        });
      });
    },
  };
};

export const postcss = true;
