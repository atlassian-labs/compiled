import type { FileInfo, API, Options, Program } from 'jscodeshift';

import {
  hasImportDeclaration,
  addCommentForUnresolvedImportSpecifiers,
  withPlugin,
  applyVisitor,
  convertMixedImportToNamedImport,
} from '../../utils/main';
import { convertStyledAttrsToComponent } from '../../utils/styled-components-attributes';
import type { CodemodPluginInstance } from '../../plugins/types';
import defaultCodemodPlugin from '../../plugins/default';

const imports = {
  compiledStyledImportName: 'styled',
  styledComponentsSupportedImportNames: ['css', 'keyframes'],
  styledComponentsPackageName: 'styled-components',
};

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  const plugins: Array<CodemodPluginInstance> = [
    defaultCodemodPlugin,
    ...options.normalizedPlugins,
  ].map((plugin) => plugin.create(fileInfo, api, options));

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
    allowedImportSpecifierNames: imports.styledComponentsSupportedImportNames,
  });

  convertMixedImportToNamedImport({
    j,
    plugins,
    collection,
    importPath: imports.styledComponentsPackageName,
    defaultSourceSpecifierName: imports.compiledStyledImportName,
    allowedImportSpecifierNames: imports.styledComponentsSupportedImportNames,
  });

  const taggedTemplateExpressions = collection.find(
    j.TaggedTemplateExpression,
    ({ tag: expression }) =>
      expression.callee.object.object.name === 'styled' &&
      expression.callee.property.name === 'attrs'
  );

  if (taggedTemplateExpressions.length) {
    convertStyledAttrsToComponent({
      j,
      plugins,
      expressions: taggedTemplateExpressions,
    });
  }

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
