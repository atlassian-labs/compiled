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

      buildAttributes({ originalNode, transformedNode, extraContent }) {
        const newDeclaration = j(originalNode).replaceWith(transformedNode).at(0).get();

        if (extraContent) {
          const hasExportDeclaration =
            newDeclaration.parentPath.value.type === 'ExportNamedDeclaration';

          j(hasExportDeclaration ? newDeclaration.parentPath : newDeclaration).insertBefore(
            extraContent
          );
        }

        return newDeclaration;
      },

      buildRefAttribute({ currentNode }) {
        return j.jsxAttribute(j.jsxIdentifier('ref'), (currentNode as JSXAttribute).value);
      },
    },
  }),
};

export default defaultCodemodPlugin;
