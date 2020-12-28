import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgJson = require('../../package.json');

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

        const children = path.get('arguments')[3];
        path.replaceWith(children);
        path.node.leadingComments = null;
      },
    },
  };
});
