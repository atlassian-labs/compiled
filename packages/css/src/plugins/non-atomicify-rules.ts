import type { Plugin, Rule, AtRule, Declaration } from 'postcss';
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
}

/**
 * At-rules whose inner rules should be scoped under `.className` —
 * mirrors the `canBeAtomified` list from `atomicify-rules.ts`.
 */
const SCOPEABLE_AT_RULES = new Set([
  'container',
  '-moz-document',
  'else',
  'layer',
  'media',
  'starting-style',
  'supports',
  'when',
]);

/**
 * At-rules whose contents must NOT be prefixed with a class selector.
 * @keyframes stops are keyframe selectors (from/to/0%), not element selectors.
 * @font-face, @property, @counter-style etc. are global descriptors.
 * Mirrors the `ignored` list from `atomicify-rules.ts`.
 */
const PASSTHROUGH_AT_RULES = new Set([
  'color-profile',
  'counter-style',
  'font-face',
  'font-palette-values',
  'keyframes',
  'page',
  'position-try',
  'property',
]);

const replaceNestingSelector = (selector: string, className: string): string =>
  selector.replace(/&/g, `.${className}`);

const scopeSelector = (selector: string, className: string): string => {
  const trimmed = selector.trim();
  if (trimmed.includes('&')) {
    return replaceNestingSelector(trimmed, className);
  }
  return `.${className} ${trimmed}`;
};

const wrapDeclInRule = (decl: Declaration, className: string): void => {
  const newRule = rule({
    selector: `.${className}`,
    nodes: [decl.clone()],
    raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
  });
  decl.replaceWith(newRule);
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
          // Top-level rule — scope all selectors under `.className`
          const ruleNode = node as Rule;
          ruleNode.selectors = ruleNode.selectors.map((sel) => scopeSelector(sel, className));

          if (!ruleNode.nodes || ruleNode.nodes.length === 0) {
            ruleNode.remove();
          }
        } else if (node.type === 'atrule') {
          const atRuleNode = node as AtRule;

          if (PASSTHROUGH_AT_RULES.has(atRuleNode.name)) {
            // @keyframes, @font-face, @property etc. — leave inner content untouched,
            // just like atomicifyRules does. Their inner "selectors" (from/to/0%) are
            // keyframe selectors, not element selectors.
            return;
          }

          if (SCOPEABLE_AT_RULES.has(atRuleNode.name)) {
            // @media, @supports, @container etc. — scope inner rules
            atRuleNode.each((child) => {
              if (child.type === 'rule') {
                const childRule = child as Rule;
                childRule.selectors = childRule.selectors.map((sel) =>
                  scopeSelector(sel, className)
                );
              } else if (child.type === 'decl') {
                // Top-level declaration inside at-rule (e.g. @media { color: red })
                wrapDeclInRule(child as Declaration, className);
              }
            });
          }
          // Unknown at-rules are passed through unchanged (lenient vs atomicifyRules which throws)
        } else if (node.type === 'decl') {
          // Top-level declaration (no selector) — wrap in `.className { … }`
          wrapDeclInRule(node as Declaration, className);
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
