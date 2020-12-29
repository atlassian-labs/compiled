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

const removeStyleDeclarations = (node: t.Node, parentPath: NodePath<any>) => {
  if (t.isCallExpression(node) && isCreateElement(node.callee)) {
    // We've found something that looks like React.createElement(CS)
    const children = node.arguments[2];
    if (t.isArrayExpression(children)) {
      children.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = parentPath.scope.getBinding(value.name);
        binding?.path.remove();
      });
    }
  } else if (
    t.isJSXElement(node) &&
    t.isJSXIdentifier(node.openingElement.name) &&
    node.openingElement.name.name === 'CS'
  ) {
    // We've found something that looks like <CS>
    const children = node.children[0];
    if (t.isJSXExpressionContainer(children) && t.isArrayExpression(children.expression)) {
      children.expression.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = parentPath.scope.getBinding(value.name);
        binding?.path.remove();
      });
    }
  }
};

export default declare((api) => {
  api.assertVersion(7);

  return {
    name: `${pkgJson.name}/babel-plugin`,
    visitor: {
      ImportSpecifier(path) {
        if (t.isIdentifier(path.node.imported) && ['CC', 'CS'].includes(path.node.imported.name)) {
          path.remove();
        }
      },
      CallExpression(path) {
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
          removeStyleDeclarations(compiledStyles.node, path);

          // All done! Let's replace this node with the user land child.
          path.replaceWith(nodeToReplace);
          path.node.leadingComments = null;
          return;
        }

        if (t.isIdentifier(callee) && callee.name === '_jsxs') {
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
          removeStyleDeclarations(compiledStyles, path);

          // All done! Let's replace this node with the user land child.
          path.replaceWith(nodeToReplace);
          path.node.leadingComments = null;
          return;
        }
      },
    },
  };
});
