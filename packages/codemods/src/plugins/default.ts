import type { JSXAttribute } from 'jscodeshift';

import type { CodemodPlugin } from './types';

const defaultCodemodPlugin: CodemodPlugin = {
  name: 'default-plugin',
  create: (_, { jscodeshift: j }) => ({
    transform: {
      buildImport({ compiledImportPath, currentNode, specifiers }) {
        const newImport = j.importDeclaration(specifiers, j.literal(compiledImportPath));

        // * Should we make a function to copy over commentLine vs commentBlock??

        // ! Note: Comments are copied over imperfectly.
        // This is due to open recast Issue #191 where trailing comments are being turned into leading comments. Link: https://github.com/benjamn/recast/issues/191
        // Also, jscodeshift does not accept location information for comments.
        // Expect inline comments to be bumped up one row.
        // TODO: Fix stupid type issue where ImportDeclaration for some reason doesn't recognise innerComments as a property. ... wait nvm it does??
        // ! Issue: Node has .comments > Statement > Declaration > ... everything else
        // ^ This should be .innerComments
        // ? Fix: declare / extend a type (Node? etc.) to handle innerComments.
        // * Blocker: idk how to do this - ASK JAKE OR (Nathan)

        // TODO: Copy over innerComments.

        // ! newImport.innerComments = currentNode.comments;

        // TODO: Copy over comments that live in specifiers.
        currentNode.specifiers?.forEach((specifier, idx) => {
          specifier.comments?.forEach((comment) => {
            // if (!newImport?.specifiers?.[idx]?.comments) {

            if (!newImport?.specifiers?.[idx]) return;

            if (!newImport.specifiers[idx].comments) {
              newImport.specifiers[idx].comments = [];
            }

            comment.type == 'CommentLine'
              ? newImport?.specifiers?.[idx]?.comments?.push(
                  // Handle Inline Comment Case
                  j.commentLine(comment.value, comment.leading, comment.trailing)
                )
              : newImport?.specifiers?.[idx]?.comments?.push(
                  // Handle Inline Comment Case
                  j.commentBlock(comment.value, comment.leading, comment.trailing)
                );
          });
        });

        // ! Copy the comments from the previous import to the new one
        newImport.comments = currentNode.comments;
        // const originalSource = j(currentNode).toSource();
        // const newProgramPath = j(originalSource).paths()[0];
        // const newPath = j(newProgramPath.value.program.body[0]).paths()[0];

        // j(newPath.value.source).replaceWith(j.literal(compiledImportPath));
        // newPath.value.source = j.stringLiteral(compiledImportPath);

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
    },
  }),
};

export default defaultCodemodPlugin;
