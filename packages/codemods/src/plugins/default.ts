import type { JSXAttribute } from 'jscodeshift';

import type { CodemodPlugin } from './types';

const defaultCodemodPlugin: CodemodPlugin = {
  name: 'default-plugin',
  create: (_, { jscodeshift: j }) => ({
    transform: {
      buildImport({ compiledImportPath, currentNode, specifiers }) {
        const newImport = j.importDeclaration(specifiers, j.literal(compiledImportPath));

        // Copy the comments from the previous import to the new one
        newImport.comments = currentNode.comments;

        return newImport;
      },

      buildAttributes({ originalNode, transformedNode, composedNode }) {
        const newDeclaration = j(originalNode).replaceWith(transformedNode).get();

        if (composedNode) {
          let candidateForInsertion = newDeclaration;

          while (candidateForInsertion.parentPath?.name !== 'body') {
            candidateForInsertion = candidateForInsertion.parentPath;
          }

          j(candidateForInsertion).insertBefore(composedNode);
        }

        return newDeclaration;
      },

      buildRefAttribute({ currentNode }) {
        return j.jsxAttribute(j.jsxIdentifier('ref'), (currentNode as JSXAttribute).value);
      },

      buildTemplateExpression({ currentNode }) {
        // replace single line comments
        const quasi = currentNode.quasi;

        const replaceRegex = /(?<!:)\/\/(.+?)(\n|$)/g;
        const replacer = '/*$1 */$2';

        j(quasi)
          .find(j.TemplateElement)
          .forEach((templateElement) => {
            const val = templateElement.value.value;

            val.cooked = val.cooked ? val.cooked.replace(replaceRegex, replacer) : null;
            val.raw = val.raw?.replace(replaceRegex, replacer);
          });

        return currentNode;
      },
    },
  }),
};

export default defaultCodemodPlugin;
