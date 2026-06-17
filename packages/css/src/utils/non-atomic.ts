import type { ChildNode } from 'postcss';

import { NON_ATOMIC_CLASS_PREFIX } from '../transform';

/**
 * Returns true if the CSS node is (or contains) a non-atomic `cssMapScoped` rule,
 * by checking whether the serialized node contains the `.cc-` prefix.
 *
 * Used consistently across `sortStyleSheet` and `mergeDuplicateAtRules` to
 * identify non-atomic rules that must preserve their source order.
 */
export const isNonAtomicNode = (node: ChildNode): boolean =>
  node.toString().includes(`.${NON_ATOMIC_CLASS_PREFIX}`);
