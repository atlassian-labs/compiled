import { plugin, Declaration, decl, rule, Rule } from 'postcss';
import { hash } from '@compiled/utils';

interface PluginOpts {
  callback?: (className: string) => void;
}

interface AtomicifyOpts extends PluginOpts {
  selector?: string;
  atRule?: string;
}

/**
 * Returns an atomic rule class name using this form:
 *
 * ```
 * "_{atrules}{selectors}{propertyname}"
 * ```
 *
 * Atomic rules are always prepended with an underscore.
 *
 * @param group
 * @param value
 */
const atomicClassName = (propName: string, value: string, opts: AtomicifyOpts) => {
  const group = hash(`${opts.atRule}${opts.selector}${propName}`).slice(0, 4);
  const valueHash = hash(value).slice(0, 4);

  return `_${group}${valueHash}`;
};

const nestedSelector = (selector: string | undefined) => {
  if (!selector) {
    return '';
  }

  const trimmed = selector.trim();

  if (trimmed.charAt(0) === ':') {
    return selector;
  }

  return ` ${selector}`;
};

const atomicifyDecl = (node: Declaration, opts: AtomicifyOpts) => {
  const normalizedSelector = nestedSelector(opts.selector);
  const className = atomicClassName(node.prop, node.value, opts);
  const selector = `.${className}${normalizedSelector}`;
  const newDecl = decl({ prop: node.prop, value: node.value });
  const newRule = rule({ selector, nodes: [newDecl] });

  // We need to link the new node to a parent else things blow up.
  newDecl.parent = newRule;
  newDecl.raws.before = '';

  if (opts.callback) {
    opts.callback(className);
  }

  return newRule;
};

const atomicifyRule = (node: Rule, opts: AtomicifyOpts) => {
  if (!node.nodes) {
    return [];
  }

  return node.nodes.map((childNode) => {
    if (childNode.type !== 'decl') {
      throw childNode.error(`Nested ${childNode.type}s are not allowed.`);
    }

    return atomicifyDecl(childNode, {
      ...opts,
      selector: node.selector,
    });
  });
};

/**
 * Transforms a style sheet into atomic rules.
 * When passing a `callback` option it will callback with created class names.
 *
 * Preconditions:
 *
 * 1. No nested rules allowed - normalized them with the `parent-orphaned-pseudos` and `nested` plugins.
 */
export const atomicifyRules = plugin<PluginOpts>('atomicify-rules', (opts = {}) => {
  return (root) => {
    root.walk((node) => {
      switch (node.type) {
        case 'decl':
          node.replaceWith(atomicifyDecl(node, opts));
          break;

        case 'rule':
          node.replaceWith(atomicifyRule(node, opts));

        default:
          break;
      }
    });
  };
});
