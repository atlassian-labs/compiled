import { plugin, rule, AtRule, Rule, atRule, Declaration } from 'postcss';

interface Opts {
  parentSelector?: string;
  parentAtRule?: string;
}

const join = (...str: (string | undefined)[]) => {
  if (!str) {
    return '';
  }

  return str
    .filter(Boolean)
    .map((inner) => inner!.replace(' ', '___').replace(/&/g, ''))
    .join('');
};

const normalizeSelector = (str?: string) => {
  if (!str) {
    return '';
  }

  return str.charAt(0) === '&' ? str.replace(/^&+/, '') : ` ${str}`;
};

const atomicifyDecl = (node: Declaration, opts: Opts = {}) => {
  const normalizedSelector = normalizeSelector(opts.parentSelector);

  const selector = `.cc-${join(opts.parentAtRule, opts.parentSelector)}-${node.prop}-${
    node.value
  }${normalizedSelector}`;

  return rule({ selector, nodes: [node] });
};

const atomicifyRule = (node: Rule, opts: Opts = {}) => {
  if (!node.nodes) {
    return [];
  }

  return node.nodes.map((childNode) => {
    if (childNode.type !== 'decl') {
      throw new Error();
    }

    return atomicifyDecl(childNode, {
      ...opts,
      parentSelector: node.selector,
    });
  });
};

const atomicifyAtRule = (node: AtRule) => {
  if (!node.nodes) {
    return [];
  }

  const normalizedName = `${node.name}${node.params.replace(/ /g, '')}`;

  const childNodes = node.nodes.map((childNode) => {
    if (childNode.type === 'rule') {
      return atomicifyRule(childNode, { parentAtRule: normalizedName });
    }

    if (childNode.type === 'decl') {
      return atomicifyDecl(childNode, { parentAtRule: normalizedName });
    }

    throw new Error();
  });

  return atRule({
    name: node.name,
    params: node.params,
    nodes: childNodes.reduce<Rule[]>((acc, val) => acc.concat(val), []),
  });
};

export const atomicify = plugin('parent-orphened-pseudos', () => {
  return (root) => {
    root.walk((node) => {
      switch (node.type) {
        case 'atrule':
          node.replaceWith(atomicifyAtRule(node));
          break;

        case 'rule':
          node.replaceWith(atomicifyRule(node));
          break;

        case 'decl':
          node.replaceWith(atomicifyDecl(node));
          break;

        default:
          break;
      }
    });
  };
});
