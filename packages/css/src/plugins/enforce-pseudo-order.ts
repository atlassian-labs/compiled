import { INCREASE_SPECIFICITY_ID } from '@compiled/utils';
import type { Plugin } from 'postcss';
import { default as selectorParser, pseudo } from 'postcss-selector-parser';

import { getPseudoSelectorScore } from '../utils/sort-pseudo-selectors';

const parser = selectorParser((root) => {
  for (const node of root.nodes) {
    if (!node.length) {
      continue;
    }

    const lastNode = node.nodes[node.nodes.length - 1];
    if (lastNode.type !== 'pseudo') {
      continue;
    }

    const pseudoSelectorScore = getPseudoSelectorScore(lastNode.value) - 1;
    if (pseudoSelectorScore < 0) {
      return;
    }

    if (node.parent) {
      node.insertAfter(
        lastNode,
        pseudo({ value: `:not(${INCREASE_SPECIFICITY_ID.repeat(pseudoSelectorScore)})` })
      );
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
          if (selector.includes('._')) {
            // This rule should only apply to Compiled generated class names.
            return parser.astSync(selector).toString();
          }

          return selector;
        });
      });
    },
  };
};
