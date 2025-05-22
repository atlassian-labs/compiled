import type { Plugin, Container, Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';

function flattenNode(node: Container) {
  node.each((child) => {
    if (!child.parent) return;

    // Recursively flatten inside at-rules
    if (child.type === 'atrule' && 'each' in child) {
      flattenNode(child as Container);
    }

    // Flatten rules with multiple selectors
    if (child.type === 'rule' && child.parent) {
      const selectors: string[] = [];
      selectorParser((root) => {
        root.each((sel) => {
          selectors.push(sel.toString().trim());
        });
      }).processSync((child as Rule).selector);
      if (selectors.length > 1) {
        selectors.forEach((selector) => {
          const rule = (child as Rule).clone();
          rule.selector = selector;
          child.parent?.insertBefore(child, rule);
        });
        child.parent?.removeChild(child);
      }
    }
  });
}

/**
 * Transforms a style sheet into atomic rules.
 * When passing a `callback` option it will callback with created class names.
 *
 * Preconditions:
 *
 * 1. No nested rules allowed - normalize them with the `parent-orphaned-pseudos` and `nested` plugins first.
 *
 * @throws Throws an error if `opts.classHashPrefix` contains invalid css class/id characters
 */
export const flattenMultipleSelectors = (): Plugin => {
  return {
    postcssPlugin: 'flatten-multiple-selectors',
    OnceExit(root) {
      flattenNode(root);
    },
  };
};
