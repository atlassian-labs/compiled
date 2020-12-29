import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import { NodePath } from '@babel/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgJson = require('../../package.json');

const isCreateElement = (node: t.Node): node is t.CallExpression => {
  return (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    node.object.name === 'React' &&
    t.isIdentifier(node.property) &&
    node.property.name === 'createElement'
  );
};

const isJsxRuntime = (node: t.Node): node is t.CallExpression => {
  return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === '_jsx';
};

const isJsxsRuntime = (node: t.Node): node is t.CallExpression => {
  return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === '_jsxs';
};

const getJsxRuntimeChildren = (node: t.CallExpression): Array<t.Expression> => {
  const props = node.arguments[1];
  const children: t.Expression[] = [];

  if (t.isObjectExpression(props)) {
    props.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
        children.push(prop.value);
      }
    });
  }

  return children;
};

const removeStyleDeclarations = (node: t.Node, parentPath: NodePath<any>, pass: PluginPass) => {
  if (t.isCallExpression(node) && isCreateElement(node.callee)) {
    // We've found something that looks like React.createElement(CS)
    const children = node.arguments[2];
    if (t.isArrayExpression(children)) {
      children.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = parentPath.scope.getBinding(value.name);
        if (binding) {
          const value = ((binding?.path?.node as t.VariableDeclarator)?.init as t.StringLiteral)
            ?.value;
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(value);
          binding.path.remove();
        }
      });
    }
  } else if (isJsxRuntime(node)) {
    // We've found something that looks like _jsx(CS)
    const [styles] = getJsxRuntimeChildren(node);

    if (t.isArrayExpression(styles)) {
      styles.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = parentPath.scope.getBinding(value.name);
        if (binding) {
          const value = ((binding?.path?.node as t.VariableDeclarator)?.init as t.StringLiteral)
            ?.value;
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(value);
          binding.path.remove();
        }
      });
    }
  } else if (
    t.isJSXElement(node) &&
    t.isJSXIdentifier(node.openingElement.name) &&
    node.openingElement.name.name === 'CS'
  ) {
    // We've found something that looks like <CS>
    const [styles] = node.children;
    if (t.isJSXExpressionContainer(styles) && t.isArrayExpression(styles.expression)) {
      styles.expression.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = parentPath.scope.getBinding(value.name);
        if (binding) {
          const value = ((binding?.path?.node as t.VariableDeclarator)?.init as t.StringLiteral)
            ?.value;
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(value);
          binding.path.remove();
        }
      });
    }
  }
};

interface PluginPass {
  opts: {
    onFoundStyleSheet?: (style: string) => void;
  };
}

export default declare<PluginPass>((api) => {
  api.assertVersion(7);

  return {
    name: `${pkgJson.name}/babel-plugin`,
    visitor: {
      ImportSpecifier(path) {
        if (t.isIdentifier(path.node.imported) && ['CC', 'CS'].includes(path.node.imported.name)) {
          path.remove();
        }
      },
      CallExpression(path, pass) {
        const callee = path.node.callee;
        if (isCreateElement(callee)) {
          // We've found something that looks like React.createElement(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!t.isIdentifier(component) || component.name !== 'CC') {
            return;
          }

          const [, , compiledStyles, nodeToReplace] = path.get('arguments');

          // Before we replace this node with its children we need to go through and remove all the
          // style declarations from the CS call.
          removeStyleDeclarations(compiledStyles.node, path, pass);

          // All done! Let's replace this node with the user land child.
          path.replaceWith(nodeToReplace);
          path.node.leadingComments = null;
          return;
        }

        if (isJsxsRuntime(path.node)) {
          // We've found something that looks like _jsxs(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!t.isIdentifier(component) || component.name !== 'CC') {
            return;
          }

          const [, props] = path.get('arguments');
          if (!t.isObjectExpression(props.node)) {
            return;
          }

          const children = props.node.properties.find((prop): prop is t.ObjectProperty => {
            return (
              t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'children'
            );
          });

          if (!children || !t.isArrayExpression(children.value)) {
            return;
          }

          const [compiledStyles, nodeToReplace] = children.value.elements as t.Expression[];

          // Before we replace this node with its children we need to go through and remove all the
          // style declarations from the CS call.
          removeStyleDeclarations(compiledStyles, path, pass);

          // All done! Let's replace this node with the user land child.
          path.replaceWith(nodeToReplace);
          path.node.leadingComments = null;
          return;
        }
      },
    },
  };
});
