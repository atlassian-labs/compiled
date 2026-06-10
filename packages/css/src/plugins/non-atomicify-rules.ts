import type { Plugin, Rule, AtRule, Declaration } from 'postcss';
import { rule } from 'postcss';

import { classifyAtRule } from './at-rule-lists';

interface PluginOpts {
  /**
   * The non-atomic class name to wrap all declarations under.
   * This is pre-computed by the caller (e.g. `cc-<hash>`).
   */
  className: string;
  /**
   * Called once with the final class name after the stylesheet has been processed.
   */
  callback?: (className: string) => void;
}

const scopeSelector = (selector: string, className: string): string => {
  const trimmed = selector.trim();
  // If the selector already has a nesting reference (&), replace it with the class.
  // Otherwise prepend the class as a ancestor scope (e.g. `.cc-xxx .panel`).
  return trimmed.includes('&')
    ? trimmed.replace(/&/g, `.${className}`)
    : `.${className} ${trimmed}`;
};

const scopeRule = (ruleNode: Rule, className: string): void => {
  ruleNode.selectors = ruleNode.selectors.map((sel) => scopeSelector(sel, className));
  if (!ruleNode.nodes || ruleNode.nodes.length === 0) {
    ruleNode.remove();
  }
};

const wrapDeclInRule = (decl: Declaration, className: string): void => {
  decl.replaceWith(
    rule({
      selector: `.${className}`,
      nodes: [decl.clone()],
      raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
    })
  );
};

/**
 * Handles an at-rule node: classifies it and either passes it through unchanged,
 * throws for forbidden/unknown rules, or scopes its inner rules under `className`.
 *
 * Mirrors the `canAtomicifyAtRule` + `atomicifyAtRule` logic from `atomicify-rules.ts`
 * but emits a single non-atomic class instead of individual atomic classes.
 */
const processAtRule = (atRuleNode: AtRule, className: string): void => {
  const kind = classifyAtRule(atRuleNode.name);

  switch (kind) {
    case 'passthrough':
      // @keyframes, @font-face, @property etc. — leave inner content untouched.
      // Their inner "selectors" (from/to/0%) are keyframe selectors, not element selectors.
      return;

    case 'forbidden':
      throw new Error(`At-rule '@${atRuleNode.name}' cannot be used in CSS rules.`);

    case 'unknown':
      throw new Error(`Unknown at-rule '@${atRuleNode.name}'.`);

    case 'scopeable':
      // @media, @supports, @container etc. — scope inner rules under the class
      atRuleNode.each((child) => {
        if (child.type === 'rule') {
          scopeRule(child as Rule, className);
        } else if (child.type === 'decl') {
          wrapDeclInRule(child as Declaration, className);
        }
      });
  }
};

/**
 * Wraps all declarations in the stylesheet under a single `.className { … }` rule,
 * keeping pseudo-selectors and at-rules intact.
 *
 * This is the non-atomic counterpart to `atomicifyRules`. Instead of splitting each
 * declaration into its own atomic rule, it groups everything under one class.
 *
 * The resulting class name has no `_` prefix, so `ax()` will treat it as an opaque
 * plain class and will NOT attempt to deduplicate it against atomic groups.
 *
 * At-rules like `@keyframes`, `@font-face`, `@property` are passed through without
 * prefixing (same behaviour as `atomicifyRules`), since their inner content is not
 * composed of element selectors.
 *
 * Preconditions: same as atomicifyRules — run `postcss-nested` before this plugin.
 */
export const nonAtomicifyRules = (opts: PluginOpts): Plugin => {
  const { className, callback } = opts;

  let callbackFired = false;

  return {
    postcssPlugin: 'non-atomicify-rules',
    OnceExit(root) {
      root.each((node) => {
        if (node.type === 'rule') {
          scopeRule(node as Rule, className);
        } else if (node.type === 'atrule') {
          processAtRule(node as AtRule, className);
        } else if (node.type === 'decl') {
          wrapDeclInRule(node as Declaration, className);
        } else if (node.type === 'comment') {
          // Strip comments — same behaviour as atomicifyRules.
          node.remove();
        }
      });

      if (!callbackFired && callback) {
        callback(className);
        callbackFired = true;
      }
    },
  };
};

export const postcss = true;
