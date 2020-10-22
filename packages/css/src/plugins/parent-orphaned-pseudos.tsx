import { plugin } from 'postcss';
import selectorParser from 'postcss-selector-parser';

const prependNestingTypeToSelector = (selector: selectorParser.Node) => {
  const { parent } = selector;

  if (parent) {
    const nesting = selectorParser.nesting();
    parent.insertBefore(selector, nesting);
  }
};

/**
 * Parent orphened pseudos PostCSS plugin.
 * This plugin will move child nested orphened pseudos to the parent declaration.
 *
 * E.g: `.class { &:hover {} }` will become `.class:hover {}`
 */
export const parentOrphanedPseudos = plugin('parent-orphened-pseudos', () => {
  return (root) => {
    root.walkRules((rule) => {
      const { selectors } = rule;

      rule.selectors = selectors.map((selector) => {
        if (!selector.startsWith(':')) {
          return selector;
        }

        const parser = selectorParser((root) => {
          root.walkPseudos((pseudoSelector) => {
            prependNestingTypeToSelector(pseudoSelector);
          });
        }).astSync(selector, { lossless: false });

        return parser.toString();
      });
    });
  };
});
