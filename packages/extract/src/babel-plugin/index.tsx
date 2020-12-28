import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import { NodePath } from '@babel/core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgJson = require('../../package.json');

const removeStyleDeclarations = (path: NodePath<any>) => {
  if (t.isCallExpression(path.node)) {
    // We've found something that looks like React.createElement(CS)
  } else if (
    t.isJSXElement(path.node) &&
    t.isJSXIdentifier(path.node.openingElement.name) &&
    path.node.openingElement.name.name === 'CS'
  ) {
    // We've found something that looks like <CS>
    const children = path.node.children[0];
    if (t.isJSXExpressionContainer(children) && t.isArrayExpression(children.expression)) {
      children.expression.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const binding = path.scope.getBinding('_');
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
        if (!t.isMemberExpression(callee)) {
          return;
        }

        const isReactObject = t.isIdentifier(callee.object) && callee.object.name === 'React';
        const isCreateElementCall =
          t.isIdentifier(callee.property) && callee.property.name === 'createElement';

        if (!isReactObject || !isCreateElementCall) {
          return;
        }

        // We've found something that looks like React.createElement(...)
        // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
        const component = path.node.arguments[0];
        if (!t.isIdentifier(component) || component.name !== 'CC') {
          return;
        }

        const [, , compiledStyles, nodeToReplace] = path.get('arguments');

        // Before we replace this node with its children we need to go through and remove all the
        // style declarations from the CS call.
        removeStyleDeclarations(compiledStyles);

        // All done! Let's replace this node with the user land child.
        path.replaceWith(nodeToReplace);
        path.node.leadingComments = null;
      },
    },
  };
});
