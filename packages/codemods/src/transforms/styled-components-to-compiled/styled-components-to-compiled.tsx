import type { API, FileInfo, Options, Program } from 'jscodeshift';

import defaultCodemodPlugin from '../../plugins/default';
import type { CodemodPluginInstance } from '../../plugins/types';
import {
  addCommentForUnresolvedImportSpecifiers,
  applyVisitor,
  convertMixedImportToNamedImport,
  hasImportDeclaration,
  withPlugin,
} from '../../utils/main';
import { convertStyledAttrsToComponent } from '../../utils/styled-components-attributes';

const imports = {
  compiledStyledImportName: 'styled',
  styledComponentsSupportedImportNames: ['css', 'keyframes'],
  styledComponentsPackageName: 'styled-components',
};

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  const plugins: CodemodPluginInstance[] = [defaultCodemodPlugin, ...options.normalizedPlugins].map(
    (plugin) => plugin.create(fileInfo, api, options)
  );

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
      expression.type === 'CallExpression' &&
      expression.callee.type === 'MemberExpression' &&
      expression.callee.object.type === 'MemberExpression' &&
      expression.callee.object.object.type === 'Identifier' &&
      expression.callee.object.object.name === 'styled' &&
      expression.callee.property.type === 'Identifier' &&
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
