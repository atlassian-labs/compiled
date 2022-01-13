import type {
  CommentBlock,
  CommentLine,
  JSXAttribute,
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
} from 'jscodeshift';

import type { CodemodPlugin } from './types';

// This is required since the imported ImportDeclaration is incorrectly typed.
// ? Although improperly typed, it doesn't seem to have any tangible impact on code structure.
// ? Maybe good to copy over for semantic reasons?
export interface ImportDeclarationWithExtraProperties extends ImportDeclaration {
  innerComments?: (CommentLine | CommentBlock)[];
  leadingComments?: (CommentLine | CommentBlock)[];
  trailingComments?: (CommentLine | CommentBlock)[];
}

const isImportSpecifier = (
  specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
): specifier is ImportSpecifier => {
  return (specifier as ImportSpecifier).imported !== undefined;
};

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

        // Copy the comments from the previous import to the new one.
        newImport.comments = currentNode.comments;

        // Copy over inline comments from the previous import to the new one
        currentNode.specifiers?.forEach((specifier) => {
          // Find correct specifier index
          const matchingSpecifierIndex = newImport.specifiers
            ? newImport.specifiers?.findIndex(
                // identity check based on imported if normal import specifier
                (newSpecifier) => {
                  if (isImportSpecifier(newSpecifier) && isImportSpecifier(specifier)) {
                    return newSpecifier.imported.name == specifier.imported.name;
                  }

                  // if newSpecifier is ImportSpecifier, check imported && local
                  return newSpecifier?.local?.name === specifier?.local?.name;
                }
              )
            : -1;
          if (matchingSpecifierIndex === -1) {
            return;
          }

          specifier.comments?.forEach((comment) => {
            if (!newImport?.specifiers?.[matchingSpecifierIndex]) return;

            if (!newImport.specifiers[matchingSpecifierIndex].comments) {
              newImport.specifiers[matchingSpecifierIndex].comments = [];
            }

            comment.type === 'CommentLine'
              ? newImport?.specifiers?.[matchingSpecifierIndex]?.comments?.push(
                  // ? Replace this with a constant?
                  j.commentLine(comment.value, true, false)
                )
              : newImport?.specifiers?.[matchingSpecifierIndex]?.comments?.push(
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

            innerComment.type === 'CommentLine'
              ? newImport.innerComments.push(
                  j.commentLine(innerComment.value, innerComment.leading, innerComment.trailing)
                )
              : newImport.innerComments.push(
                  j.commentBlock(innerComment.value, innerComment.leading, innerComment.trailing)
                );
          }
        );

        (currentNode as ImportDeclarationWithExtraProperties)?.leadingComments?.forEach(
          (leadingComment) => {
            if (!newImport.leadingComments) {
              newImport.leadingComments = [];
            }

            leadingComment.type === 'CommentLine'
              ? newImport.leadingComments.push(
                  j.commentLine(
                    leadingComment.value,
                    leadingComment.leading,
                    leadingComment.trailing
                  )
                )
              : newImport.leadingComments.push(
                  j.commentBlock(
                    leadingComment.value,
                    leadingComment.leading,
                    leadingComment.trailing
                  )
                );
          }
        );

        (currentNode as ImportDeclarationWithExtraProperties)?.trailingComments?.forEach(
          (trailingComment) => {
            if (!newImport.trailingComments) {
              newImport.trailingComments = [];
            }

            trailingComment.type === 'CommentLine'
              ? newImport.trailingComments.push(
                  j.commentLine(
                    trailingComment.value,
                    trailingComment.leading,
                    trailingComment.trailing
                  )
                )
              : newImport.trailingComments.push(
                  j.commentBlock(
                    trailingComment.value,
                    trailingComment.leading,
                    trailingComment.trailing
                  )
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
