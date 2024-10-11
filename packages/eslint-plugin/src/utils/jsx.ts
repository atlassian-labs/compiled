import { COMPILED_IMPORT, JSX_ANNOTATION_REGEX } from '@compiled/utils';
import type { Comment, ImportDeclaration, ImportSpecifier } from 'estree';

const importsToNames = (compiledImports: ImportDeclaration[]): string[] =>
  compiledImports.flatMap((declaration) => {
    return String(declaration.source.value);
  });

export const filterCompiledImportWithJsx = (
  compiledImports: ImportDeclaration[]
): ImportDeclaration[] => {
  return compiledImports.filter((imp) =>
    imp.specifiers.some(
      (spec): spec is ImportSpecifier =>
        spec.type === 'ImportSpecifier' && spec.imported.name === 'jsx'
    )
  );
};

/**
 * Return the JSX pragma, which looks like this:
 *
 *     /** @ jsx jsx * /
 *
 * ... if it exists AND if jsx is imported from "@compiled/react".
 *
 * The JSX pragma is a special comment at the _beginning_ of the file
 * used to find the jsx namespace in TypeScript. It is also used by Babel's
 * @babel/plugin-transform-react-jsx to override the function used
 * when converting JSX syntax to plain JS (React.createElement by default).
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
    const match = JSX_ANNOTATION_REGEX.exec(comment.value);
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

export const getDefaultCompiledImport = (compiledImports: ImportDeclaration[]): string => {
  return importsToNames(compiledImports)[0] || COMPILED_IMPORT;
};

export const findJsxImportSourcePragma = (
  comments: Comment[],
  importSources: string[]
): Comment | undefined => {
  const defaultedImportSources = [...new Set([...importSources, COMPILED_IMPORT])];

  return comments.find((n) =>
    defaultedImportSources.some((jsxImportSource) =>
      n.value.includes(`@jsxImportSource ${jsxImportSource}`)
    )
  );
};
