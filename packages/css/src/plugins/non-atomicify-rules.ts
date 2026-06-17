import type { Plugin, Rule, AtRule, Declaration, ChildNode } from 'postcss';
import { rule } from 'postcss';

import { canProcessAtRule } from './at-rule-lists';

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
 * Normalizes a selector so it always contains a `&` nesting reference —
 * mirrors `normalizeSelector` from `atomicify-rules.ts`.
 *
 * `undefined` / empty → `'&'`  (top-level declaration, no selector context)
 * `'.panel'`          → `'& .panel'`  (plain child, prepend nesting ref)
 * `'&:hover'`         → `'&:hover'`   (already has `&`, leave as-is)
 */
const normalizeSelector = (selector: string | undefined): string => {
  if (!selector) return '&';
  const trimmed = selector.trim();
  return trimmed.includes('&') ? trimmed : `& ${trimmed}`;
};

/**
 * Scopes a single selector string under `.className` by replacing all `&`
 * nesting references with the class name.
 *
 * Delegates to `normalizeSelector` first to ensure `&` is always present,
 * then performs the replacement — equivalent to calling `normalizeSelector`
 * followed by `replaceNestingSelector` in `atomicify-rules.ts`.
 *
 * e.g. `undefined` → `.cc-xxx`, `'.panel'` → `.cc-xxx .panel`, `'&:hover'` → `.cc-xxx:hover`
 */
const scopeSelector = (selector: string | undefined, className: string): string =>
  normalizeSelector(selector).replace(/&/g, `.${className}`);

/**
 * Rewrites all selectors on a rule node to be scoped under `.className`,
 * returning a new clean rule node — mirrors the `atomicifyRule` pattern.
 *
 * e.g. `.panel` → `.cc-xxx .panel`, `&:hover` → `.cc-xxx:hover`
 *
 * Unlike `atomicifyRule` which splits a rule into one atomic rule per declaration,
 * `scopeRule` keeps the rule intact and only rewrites its selector — all child
 * declarations remain grouped under the single scoped selector.
 *
 * Throws if un-flattened nested rules are found, mirroring the guard in
 * `atomicifyRule`. Run `postcss-nested` before this plugin.
 */
const scopeRule = (ruleNode: Rule, className: string): Rule[] => {
  ruleNode.each((child) => {
    if (child.type === 'rule') {
      throw child.error(
        'Nested rules need to be flattened first — run the "postcss-nested" plugin before this.'
      );
    }
    // Non-decl children (comments etc.) inside a rule are left as-is —
    // we only rewrite the rule's selector, not its children.
  });

  if (!ruleNode.nodes) {
    return [];
  }

  return [
    rule({
      selectors: ruleNode.selectors.map((sel) => scopeSelector(sel, className)),
      nodes: ruleNode.nodes,
      raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
    }),
  ];
};

/**
 * Wraps a bare declaration in a new rule scoped to `.className` —
 * mirrors `atomicifyDecl` from `atomicify-rules.ts` but emits a single
 * grouped rule instead of one atomic rule per declaration.
 *
 * e.g. `color: red` → `.cc-xxx { color: red }`
 *
 * Handles top-level declarations inside a cssMap variant, as well as
 * bare declarations inside scopeable at-rules (e.g. `@media { color: red }`).
 */
const scopeDecl = (decl: Declaration, className: string): Rule => {
  return rule({
    selector: `.${className}`,
    nodes: [decl.clone()],
    raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
  });
};

/**
 * Scopes an at-rule node under `.className` using `canProcessAtRule`,
 * returning a new cloned at-rule with clean `raws` and rebuilt children —
 * mirrors the `atomicifyAtRule` pattern.
 *
 * - Returns a new node (`@media`, `@supports`, `@container` etc.): scopes all inner rules
 *   and bare declarations under `.className`.
 * - Returns the original node (`@keyframes`, `@font-face`, `@property` etc.): left completely
 *   untouched — their inner content is not composed of element selectors.
 * - Throws for forbidden (`@charset`, `@import`, `@namespace`) or unknown at-rules.
 *
 * Mirrors `atomicifyAtRule` from `atomicify-rules.ts`.
 */
const scopeAtRule = (atRuleNode: AtRule, className: string): AtRule => {
  if (!canProcessAtRule(atRuleNode.name)) {
    // passthrough — @keyframes, @font-face, @property etc.
    return atRuleNode;
  }

  const children: ChildNode[] = [];
  const newNode = atRuleNode.clone({
    raws: {
      before: '',
      between: '',
      semicolon: false,
      params: { raw: '', value: '' },
    },
    nodes: children,
  });

  atRuleNode.each((child) => {
    switch (child.type) {
      case 'rule':
        scopeRule(child as Rule, className).forEach((r) => newNode.append(r));
        break;
      case 'decl':
        newNode.append(scopeDecl(child as Declaration, className));
        break;
      case 'atrule':
        newNode.append(scopeAtRule(child as AtRule, className));
        break;
      default:
        break;
    }
  });

  return newNode;
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
        switch (node.type) {
          case 'rule':
            node.replaceWith(scopeRule(node as Rule, className));
            break;
          case 'atrule':
            node.replaceWith(scopeAtRule(node as AtRule, className));
            break;
          case 'decl':
            node.replaceWith(scopeDecl(node as Declaration, className));
            break;
          case 'comment':
            // Strip comments — same behaviour as atomicifyRules.
            node.remove();
            break;
          default:
            break;
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
