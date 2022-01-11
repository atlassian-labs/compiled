import type { CommentBlock, CommentLine, JSXAttribute, ImportDeclaration } from 'jscodeshift';

import type { CodemodPlugin } from './types';

// This is required since the imported ImportDeclaration is incorrectly typed (does not have an innerComments property.)
// ? Although improperly typed, it doesn't seem to have any tangible impact on code structure.
// ? Maybe good to copy over for semantic reasons?
export interface ImportDeclarationWithExtraProperties extends ImportDeclaration {
  innerComments?: (CommentLine | CommentBlock)[];
  leadingComments?: (CommentLine | CommentBlock)[];
  trailingComments?: (CommentLine | CommentBlock)[];
}

const defaultCodemodPlugin: CodemodPlugin = {
  name: 'default-plugin',
  create: (_, { jscodeshift: j }) => ({
    transform: {
      buildImport({ compiledImportPath, currentNode, specifiers }) {
        const newImport: ImportDeclarationWithExtraProperties = j.importDeclaration(
          specifiers,
          j.literal(compiledImportPath)
        );

        // ! Note: Comments are copied over imperfectly.
        // This is due to open recast Issue #191 where trailing comments are being turned into leading comments. Link: https://github.com/benjamn/recast/issues/191
        // Also, jscodeshift does not accept location information for comments.
        // Expect inline comments to be bumped up one row.

        // ? Named to Default Specifier
        // ? Make comments consistent - formatted (maybe copy over source? idk)

        // Copy the comments from the previous import to the new one
        newImport.comments = currentNode.comments;

        // Copy over inline comments from the previous import to the new one
        currentNode.specifiers?.forEach((specifier, idx) => {
          specifier.comments?.forEach((comment) => {
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

        // Copy over inner, leading and trailing comments from previous import to the new one
        (currentNode as ImportDeclarationWithExtraProperties)?.innerComments?.forEach(
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

        (currentNode as ImportDeclarationWithExtraProperties)?.leadingComments?.forEach(
          (leadingComment) => {
            if (!newImport.leadingComments) {
              newImport.leadingComments = [];
            }

            leadingComment.type == 'CommentLine'
              ? newImport.leadingComments.push(
                  // j.commentLine(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentLine(leadingComment.value, true, false)
                )
              : newImport.leadingComments.push(
                  // j.commentBlock(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentBlock(leadingComment.value, true, false)
                );
          }
        );

        (currentNode as ImportDeclarationWithExtraProperties)?.trailingComments?.forEach(
          (trailingComment) => {
            if (!newImport.trailingComments) {
              newImport.trailingComments = [];
            }

            trailingComment.type == 'CommentLine'
              ? newImport.trailingComments.push(
                  // j.commentLine(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentLine(trailingComment.value, true, false)
                )
              : newImport.trailingComments.push(
                  // j.commentBlock(innerComment.value, innerComment.leading, innerComment.trailing)
                  j.commentBlock(trailingComment.value, true, false)
                );
          }
        );

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
