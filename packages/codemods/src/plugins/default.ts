import type { CommentBlock, CommentLine, JSXAttribute, ImportDeclaration } from 'jscodeshift';

import type { CodemodPlugin } from './types';

// This is required since the imported ImportDeclaration is incorrectly typed (does not have an innerComments property.)
export interface ImportDeclarationWithInnerComments extends ImportDeclaration {
  innerComments?: (CommentLine | CommentBlock)[];
}

const defaultCodemodPlugin: CodemodPlugin = {
  name: 'default-plugin',
  create: (_, { jscodeshift: j }) => ({
    transform: {
      buildImport({ compiledImportPath, currentNode, specifiers }) {
        const newImport: ImportDeclarationWithInnerComments = j.importDeclaration(
          specifiers,
          j.literal(compiledImportPath)
        );

        // ! Note: Comments are copied over imperfectly.
        // This is due to open recast Issue #191 where trailing comments are being turned into leading comments. Link: https://github.com/benjamn/recast/issues/191
        // Also, jscodeshift does not accept location information for comments.
        // Expect inline comments to be bumped up one row.

        // ? Named to Default Specifier
        // ? Make comments consistent - formatted (maybe copy over source? idk)

        // TODO: Copy over innerComments.
        (currentNode as ImportDeclarationWithInnerComments)?.innerComments?.forEach(
          (innerComment) => {
            if (!newImport.innerComments) {
              newImport.innerComments = [];
            }

            innerComment.type == 'CommentLine'
              ? newImport.innerComments.push(
                  // j.commentLine(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentLine(innerComment.value, true, false)
                )
              : newImport.innerComments.push(
                  // j.commentBlock(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentBlock(innerComment.value, true, false)
                );
          }
        );

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
                  // j.commentLine(comment.value, comment.leading, comment.trailing)
                  j.commentLine(comment.value, true, false)
                )
              : newImport?.specifiers?.[idx]?.comments?.push(
                  // Handle Inline Comment Case
                  // j.commentBlock(comment.value, comment.leading, comment.trailing)
                  j.commentBlock(comment.value, true, false)
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
