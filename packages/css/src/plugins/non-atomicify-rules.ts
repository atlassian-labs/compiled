import type { Plugin, Rule, AtRule } from 'postcss';
import { rule } from 'postcss';

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
  /**
   * Optional prefix that was applied when generating the class name.
   * Unused at this level (already baked into `className`) but kept for API symmetry
   * with atomicifyRules.
   */
  classHashPrefix?: string;
}

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
          const ruleNode = node as Rule;
          // Replace each selector, substituting `&` with `.className`
          ruleNode.selectors = ruleNode.selectors.map((sel) => {
            const trimmed = sel.trim();
            if (trimmed.includes('&')) {
              return trimmed.replace(/&/g, `.${className}`);
            }
            // Plain selector (e.g. `div span`) — nest under the class
            return `.${className} ${trimmed}`;
          });

          // If there are no declarations left (empty rule), remove it
          if (!ruleNode.nodes || ruleNode.nodes.length === 0) {
            ruleNode.remove();
            return;
          }
        } else if (node.type === 'atrule') {
          // At-rules (@media, @supports, @container …) — wrap inner rules
          const atRuleNode = node as AtRule;
          atRuleNode.each((child) => {
            if (child.type === 'rule') {
              const childRule = child as Rule;
              childRule.selectors = childRule.selectors.map((sel) => {
                const trimmed = sel.trim();
                if (trimmed.includes('&')) {
                  return trimmed.replace(/&/g, `.${className}`);
                }
                return `.${className} ${trimmed}`;
              });
            } else if (child.type === 'decl') {
              // Top-level declarations inside an at-rule — wrap in a rule
              const newRule = rule({
                selector: `.${className}`,
                nodes: [child.clone()],
                raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
              });
              child.replaceWith(newRule);
            }
          });
        } else if (node.type === 'decl') {
          // Top-level declarations (no selector) — wrap in `.className { … }`
          const newRule = rule({
            selector: `.${className}`,
            nodes: [node.clone()],
            raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
          });
          node.replaceWith(newRule);
        }
      });

      // Emit the class name exactly once
      if (!callbackFired && callback) {
        callback(className);
        callbackFired = true;
      }
    },
  };
};

export const postcss = true;
