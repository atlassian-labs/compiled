import type { JSXAttribute } from 'jscodeshift';
import type { CodemodPlugin } from './types';

const defaultCodemodPlugin: CodemodPlugin = {
  name: 'default-plugin',
  create: (_, { jscodeshift: j }) => ({
    transform: {
      buildImport({ compiledImportPath, currentNode, defaultSpecifierName, namedImport }) {
        const newImport = j.importDeclaration(
          [j.importSpecifier(j.identifier(namedImport), j.identifier(defaultSpecifierName))],
          j.literal(compiledImportPath)
        );

        // Copy the comments from the previous import to the new one
        newImport.comments = currentNode.comments;

        return newImport;
      },

      buildRefAttribute({ currentNode }) {
        return j.jsxAttribute(j.jsxIdentifier('ref'), (currentNode as JSXAttribute).value);
      },
    },
  }),
};

export default defaultCodemodPlugin;
