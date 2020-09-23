import { plugin, Node, Declaration, decl, rule, Rule, AtRule } from 'postcss';
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

const normalizeSelector = (selector: string | undefined) => {
  if (!selector) {
    return '';
  }

  // We want to build a consistent selector that we will use to generate the group hash.
  // Because of that we trim whitespace as well as removing any top level nesting "&".
  const trimmed = selector.trim();

  switch (trimmed.charAt(0)) {
    case ':':
      return trimmed;

    case '&':
      return trimmed.replace('&', '');

    default:
      return ` ${trimmed}`;
  }
};

const replaceNestingSelector = (selector: string, parentClassName: string) => {
  return selector.replace(/ &/g, ` .${parentClassName}`);
};

const atomicifyDecl = (node: Declaration, opts: AtomicifyOpts) => {
  const initialSelector = normalizeSelector(opts.selector);
  const className = atomicClassName(node.prop, node.value, {
    ...opts,
    selector: initialSelector,
  });
  const selector = `.${className}${replaceNestingSelector(initialSelector, className)}`;
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

const atomicifyAtRule = (node: AtRule, opts: AtomicifyOpts): AtRule => {
  let children: Node[] = [];
  const atRuleLabel = `${opts.atRule || ''}${node.name}${node.params}`;
  const atRuleOpts = {
    ...opts,
    atRule: atRuleLabel,
  };

  node.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        children.push(atomicifyAtRule(childNode, atRuleOpts));
        break;

      case 'rule':
        children = children.concat(atomicifyRule(childNode, atRuleOpts));
        break;

      case 'decl':
        children.push(atomicifyDecl(childNode, atRuleOpts));
        break;

      default:
        break;
    }
  });

  return node.clone({ nodes: children });
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
    root.each((node) => {
      switch (node.type) {
        case 'atrule':
          node.replaceWith(atomicifyAtRule(node, opts));
          break;

        case 'rule':
          node.replaceWith(atomicifyRule(node, opts));
          break;

        case 'decl':
          node.replaceWith(atomicifyDecl(node, opts));
          break;

        default:
          break;
      }
    });
  };
});
