import type { FileInfo, API, Options, Program } from 'jscodeshift';

import {
  hasImportDeclaration,
  convertDefaultImportToNamedImport,
  addCommentForUnresolvedImportSpecifiers,
  withPlugin,
  applyVisitor,
} from '../../codemods-helpers';
import type { CodemodPlugin } from '../../plugins/types';

const imports = {
  compiledStyledImportName: 'styled',
  styledComponentsPackageName: 'styled-components',
};

export const transformer = (
  fileInfo: FileInfo,
  { jscodeshift: j }: API,
  options: Options
): string => {
  const { source } = fileInfo;
  const collection = j(source);
  const plugins: Array<CodemodPlugin> = options.pluginModules;

  const originalProgram: Program = j(source).find(j.Program).get();

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
    plugins,
    collection,
    importPath: imports.styledComponentsPackageName,
    namedImport: imports.compiledStyledImportName,
  });

  const currentProgram = collection.find(j.Program);
  applyVisitor({
    j,
    plugins,
    originalProgram,
    currentProgram: currentProgram.get(),
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
