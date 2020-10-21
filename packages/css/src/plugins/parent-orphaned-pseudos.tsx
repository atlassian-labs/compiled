import { plugin } from 'postcss';
import selectorParser from 'postcss-selector-parser';

const isPreviousSelectorCombinatorType = (selector: selectorParser.Node) => {
  const previousSelector = selector.prev();
  return previousSelector && previousSelector.type === 'combinator';
};

const prependNestingTypeToSelector = (selector: selectorParser.Node) => {
  const { parent } = selector;

  if (parent) {
    const nesting = selectorParser.nesting();
    parent.insertBefore(selector, nesting);
  }
};

const stringifySelectorParserRoot = (parserRoot: selectorParser.Root) => {
  return parserRoot
    .reduce<string[]>((memo, selector) => [...memo, String(selector)], [])
    .join(',\n');
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
      const { selector: ruleSelector } = rule;

      if (!ruleSelector.startsWith(':')) {
        return;
      }

      const selectorParserRoot = selectorParser((selectors) => {
        selectors.walkPseudos((selector) => {
          if (isPreviousSelectorCombinatorType(selector)) {
            return;
          }

          prependNestingTypeToSelector(selector);
        });
      }).astSync(ruleSelector, { lossless: false });

      rule.selector = stringifySelectorParserRoot(selectorParserRoot);
    });
  };
});
