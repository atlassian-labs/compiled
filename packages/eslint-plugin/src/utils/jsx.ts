import type { Comment, ImportDeclaration } from 'estree';

/**
 * Return the "@ jsx jsx" JSX pragma (i.e. a comment that has special
 * meaning to the TypeScript compiler), if it exists AND if jsx is
 * imported from "@compiled/react".
 */
export const findJsxPragma = (
  comments: Comment[],
  compiledImports: ImportDeclaration[]
): Comment | undefined => {
  let jsxPragma: Comment | undefined = undefined;
  // It is surprisingly possible to specify the JSX pragma with a
  // value other than "jsx", e.g. "@ jsx myCustomJsxFunction", as long
  // as that is imported somehow (e.g. import { myCustomJsxFunction } from 'xyz').
  let jsxPragmaName = '';

  for (const comment of comments) {
    const match = /@jsx (\w+)/.exec(comment.value);
    if (match) {
      jsxPragma = comment;
      jsxPragmaName = match[1];
    }
  }

  if (!jsxPragma) return undefined;

  for (const importDecl of compiledImports) {
    for (const specifier of importDecl.specifiers) {
      const jsxPragmaUsesCompiled =
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.name === 'jsx' &&
        specifier.local.name === jsxPragmaName;

      if (jsxPragmaUsesCompiled) return jsxPragma;
    }
  }

  return undefined;
};

export const findJsxImportSourcePragma = (comments: Comment[]): Comment | undefined =>
  comments.find((n) => n.value.indexOf('@jsxImportSource @compiled/react') > -1);
