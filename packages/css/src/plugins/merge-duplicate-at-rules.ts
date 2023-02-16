import type { AtRule, ChildNode, Plugin } from 'postcss';

/**
 * Plugin to remove duplicate children found in at-rules.
 * Currently does not handle nested at-rules.
 *
 * Before:
 *
 * ```css
 * @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
 * @media (min-width:500px){._171dak0l{border:2px solid red}}
 * ```
 *
 * After:
 *
 * ```css
 * @media (min-width:500px){._171dak0l{border:2px solid red}._1swkri7e:before{content:'large screen'}}
 * ```
 */
export const mergeDuplicateAtRules = (): Plugin => {
  return {
    postcssPlugin: 'merge-duplicate-at-rules',
    prepare() {
      const atRuleStore: Record<string, { node: AtRule; children: Record<string, ChildNode> }> = {};
      return {
        AtRule(atRule) {
          const name = atRule.name + atRule.params;
          if (!atRuleStore[name]) {
            atRuleStore[name] = {
              node: atRule,
              children: {},
            };
          }

          atRule.each((node) => {
            const stringifiedNode = node.toString();
            if (!atRuleStore[name].children[stringifiedNode]) {
              atRuleStore[name].children[stringifiedNode] = node;
            }
          });

          atRule.remove();
        },
        OnceExit(root) {
          for (const key in atRuleStore) {
            const { node, children } = atRuleStore[key];
            node.nodes = Object.values(children);
            root.append(node);
          }
        },
      };
    },
  };
};

export const postcss = true;
