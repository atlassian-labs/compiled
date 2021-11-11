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
        if (
          originalNode.value.type === 'VariableDeclaration' ||
          originalNode.value.type === 'TaggedTemplateExpression'
        ) {
          const newDeclaration = j(originalNode).replaceWith(transformedNode).get();

          if (composedNode) {
            let candidateForInsertion = newDeclaration;

            while (
              candidateForInsertion.parentPath &&
              candidateForInsertion.parentPath.name !== 'body'
            ) {
              candidateForInsertion = candidateForInsertion.parentPath;
            }

            j(candidateForInsertion).insertBefore(composedNode);
          }

          return newDeclaration;
        }

        throw new Error(
          'VariableDeclaration, ExportNamedDeclaration & ExportDefaultDeclaration supported only'
        );
      },

      buildRefAttribute({ currentNode }) {
        return j.jsxAttribute(j.jsxIdentifier('ref'), (currentNode as JSXAttribute).value);
      },
    },
  }),
};

export default defaultCodemodPlugin;
