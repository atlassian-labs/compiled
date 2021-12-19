import { declare } from '@babel/helper-plugin-utils';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import type { PluginPass } from './types';
import { isAutomaticRuntime } from './utils/is-automatic-runtime';
import { isCCComponent } from './utils/is-cc-component';
import { isCreateElement } from './utils/is-create-element';
import { removeStyleDeclarations } from './utils/remove-style-declarations';

const DOM_IMPORT_SOURCE = '@compiled/dom__experimental';
const DOM_RUNTIME_CALL = 'insertStyles';

export default declare<PluginPass>((api) => {
  api.assertVersion(7);

  return {
    name: '@compiled/babel-plugin-strip-runtime',
    pre() {
      this.styleRules = [];
    },
    visitor: {
      Program: {
        exit() {
          if (this.opts.onFoundStyleRules) {
            this.opts.onFoundStyleRules(this.styleRules);
          }
        },
      },
      ImportSpecifier(path) {
        if (t.isIdentifier(path.node.imported) && ['CC', 'CS'].includes(path.node.imported.name)) {
          path.remove();
        }
      },
      ImportDeclaration(path) {
        if (path.node.source.value === DOM_IMPORT_SOURCE) {
          this.dom__experimental = true;

          // Remove first import "insertStyles" as the runtime isn't needed anymore.
          path.get('specifiers')[0].remove();
        }
      },
      JSXElement(path, pass) {
        if (!t.isJSXIdentifier(path.node.openingElement.name)) {
          return;
        }

        const componentName = path.node.openingElement.name.name;
        if (componentName !== 'CC') {
          return;
        }

        const [, compiledStyles, , nodeToReplace] = path.get('children');

        // Before we replace this node with its children we need to go through and remove all the
        // style declarations from the CS call.
        removeStyleDeclarations(compiledStyles.node, path, pass);

        if (t.isJSXExpressionContainer(nodeToReplace.node)) {
          const container = nodeToReplace as NodePath<t.JSXExpressionContainer>;
          path.replaceWith(container.node.expression);
        } else {
          path.replaceWith(nodeToReplace);
        }

        // All done! Let's replace this node with the user land child.
        path.node.leadingComments = null;
        return;
      },
      CallExpression(path, pass) {
        const callee = path.node.callee;

        if (
          this.dom__experimental &&
          t.isIdentifier(callee) &&
          callee.name === DOM_RUNTIME_CALL &&
          t.isArrayExpression(path.node.arguments[0])
        ) {
          path.node.arguments[0].elements.forEach((arg) => {
            if (t.isStringLiteral(arg)) {
              this.styleRules.push(arg.value);
            }
          });

          path.remove();
        }

        if (isCreateElement(callee)) {
          // We've found something that looks like React.createElement(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!isCCComponent(component)) {
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

        if (isAutomaticRuntime(path.node, 'jsxs')) {
          // We've found something that looks like _jsxs(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!isCCComponent(component)) {
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

          const [compiledStyles, nodeToReplace] = children.value.elements;
          if (!t.isExpression(nodeToReplace) || !t.isExpression(compiledStyles)) {
            throw new Error('Nodes should be expressions.');
          }

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
