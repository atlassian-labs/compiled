import { FileInfo, API, Options } from 'jscodeshift';

import { hasImportDeclaration, buildDefaultImportDeclaration } from '../codemods-helpers';

const imports = {
  compiledPackageName: '@compiled/react',
  compiledImportName: 'styled',
  styledComponentsPackageName: 'styled-components',
};

const transformer = (fileInfo: FileInfo, { jscodeshift: j }: API, options: Options) => {
  const { source } = fileInfo;
  const collection = j(source);

  const hasStyledComponentsImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.styledComponentsPackageName,
  });

  if (!hasStyledComponentsImportDeclaration) {
    return source;
  }

  buildDefaultImportDeclaration({
    j,
    collection,
    importPathFrom: imports.styledComponentsPackageName,
    importPathTo: imports.compiledPackageName,
    importPathToName: imports.compiledImportName,
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
