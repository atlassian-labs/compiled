import { INCREASE_SPECIFICITY_ID, getPseudoSelectorScore } from '@compiled/utils';
import type { Plugin } from 'postcss';
import { default as selectorParser, pseudo } from 'postcss-selector-parser';

const parser = selectorParser((root) => {
  for (const node of root.nodes) {
    if (!node.length) {
      continue;
    }

    const lastNode = node.nodes[node.nodes.length - 1];

    for (let i = node.nodes.length - 1; i >= 0; i--) {
      const currentNode = node.nodes[i];
      if (currentNode.type !== 'pseudo') {
        continue;
      }

      const pseudoSelectorScore = getPseudoSelectorScore(currentNode.value);
      if (pseudoSelectorScore < 0) {
        continue;
      }

      // If pseudoSelectorScore == 0 (lowest specificity/priority in our
      // pseudo-selector ordering), we can just skip adding :not(#\#) entirely, because
      // we only care about the specificity of pseudo-selectors relative to each other.
      if (pseudoSelectorScore === 0) {
        return;
      }

      if (node.parent) {
        node.insertAfter(
          lastNode,
          pseudo({ value: `:not(${INCREASE_SPECIFICITY_ID.repeat(pseudoSelectorScore)})` })
        );
        return;
      }
    }
  }
});

/**
 * Increase the specificity of pseudo-selectors generated in Compiled by appending ":not(#\\#)", in such a way that they are applied by the browser in the correct order.
 *
 * The order of the pseudo-selectors is defined in `packages/css/src/utils/style-ordering.ts`.
 *
 * Just like with the increase-specificity plugin, this rule should run after CSS declarations have been atomicized and should not affect the original generated class name.
 *
 * This is necessary if you anticipate that other developers will import your Compiled components from two different files or packages.
 */
export const enforcePseudoOrder = (): Plugin => {
  return {
    postcssPlugin: 'enforce-pseudo-order',
    OnceExit(root) {
      root.walkRules((rule) => {
        rule.selectors = rule.selectors.map((selector) => {
          return parser.astSync(selector).toString();
        });
      });
    },
  };
};
