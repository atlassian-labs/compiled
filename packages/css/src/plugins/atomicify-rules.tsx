import { plugin, Declaration, decl, rule, Root } from 'postcss';
import { hash } from '@compiled/utils';

interface AtomicifyOpts {
  root: Root;
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

const atomicifyDecl = (node: Declaration, opts: AtomicifyOpts) => {
  const normalizedSelector = opts.selector || '';
  const className = atomicClassName(node.prop, node.value, opts);
  const selector = `.${className}${normalizedSelector}`;
  const newDecl = decl({ prop: node.prop, value: node.value });
  const newRule = rule({ selector, nodes: [newDecl] });

  newDecl.parent = newRule;
  newDecl.raws.before = '';

  return newRule;
};

/**
 * PostCSS plugin which will callback when traversing through each root declaration.
 */
export const atomicifyRules = plugin('atomicify-rules', () => {
  return (root) => {
    root.walk((node) => {
      switch (node.type) {
        case 'decl':
          node.replaceWith(atomicifyDecl(node, { root }));
          break;

        default:
          break;
      }
    });
  };
});
