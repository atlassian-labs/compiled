import type { AtRule, Container, Plugin } from 'postcss';

import { isNonAtomicNode } from '../utils/non-atomic';

/**
 * Plugin to remove duplicate children found in at-rules.
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
const mergeAtRules = (container: Container, moveAtRulesToEnd = false): void => {
  const atRuleStore = new Map<string, AtRule>();

  for (const node of [...container.nodes]) {
    if (node.type !== 'atrule' || isNonAtomicNode(node)) {
      continue;
    }

    const name = `${node.name}\0${node.params}`;
    const existingAtRule = atRuleStore.get(name);

    if (!existingAtRule) {
      atRuleStore.set(name, node);
      continue;
    }

    const existingChildren = new Set(existingAtRule.nodes?.map((child) => child.toString()));
    for (const child of [...(node.nodes || [])]) {
      const stringifiedChild = child.toString();
      if (!existingChildren.has(stringifiedChild)) {
        existingAtRule.append(child);
        existingChildren.add(stringifiedChild);
      }
    }

    node.remove();
  }

  for (const node of container.nodes) {
    if (node.type === 'atrule' && !isNonAtomicNode(node)) {
      mergeAtRules(node);
    }
  }

  if (moveAtRulesToEnd) {
    for (const atRule of atRuleStore.values()) {
      atRule.remove();
      container.append(atRule);
    }
  }
};

export const mergeDuplicateAtRules = (): Plugin => {
  return {
    postcssPlugin: 'merge-duplicate-at-rules',
    OnceExit(root) {
      mergeAtRules(root, true);
    },
  };
};

export const postcss = true;
