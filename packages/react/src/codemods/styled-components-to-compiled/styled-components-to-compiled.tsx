import { FileInfo, API, Options } from 'jscodeshift';

import {
  hasImportDeclaration,
  convertDefaultImportToNamedImport,
  addCommentForUnresolvedImportSpecifiers,
} from '../codemods-helpers';

const imports = {
  compiledStyledImportName: 'styled',
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

  addCommentForUnresolvedImportSpecifiers({
    j,
    collection,
    importPath: imports.styledComponentsPackageName,
    allowedImportSpecifierNames: [],
  });

  convertDefaultImportToNamedImport({
    j,
    collection,
    importPath: imports.styledComponentsPackageName,
    namedImport: imports.compiledStyledImportName,
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
