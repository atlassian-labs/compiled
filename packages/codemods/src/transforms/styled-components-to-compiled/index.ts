import type { API, FileInfo, Options, Program, TaggedTemplateExpression } from 'jscodeshift';

import defaultCodemodPlugin from '../../plugins/default';
import type { CodemodPluginInstance } from '../../plugins/types';
import {
  addCommentForUnresolvedImportSpecifiers,
  applyVisitor,
  convertMixedImportToNamedImport,
  hasImportDeclaration,
  withPlugin,
} from '../../utils';

import {
  getCompiledLocalStyledName,
  convertStyledAttrsToComponent,
  convertTaggedTemplates,
} from './utils';

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

  const compiledLocalStyledName = getCompiledLocalStyledName(j, collection);

  if (compiledLocalStyledName) {
    convertTaggedTemplates({ j, plugins, collection, compiledLocalStyledName });
  }

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
  });

  // compiled styled object might've been renamed, we need to find it again
  const compiledLocalStyledNameAfterVisitor = getCompiledLocalStyledName(j, collection);

  if (compiledLocalStyledNameAfterVisitor) {
    const taggedTemplateExpressionsWithAttrs = collection.find(
      j.TaggedTemplateExpression,
      ({ tag }: TaggedTemplateExpression) => {
        if (tag.type === 'CallExpression') {
          const { callee } = tag;

          return (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'MemberExpression' &&
            callee.object.object.type === 'Identifier' &&
            callee.object.object.name === compiledLocalStyledNameAfterVisitor &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'attrs'
          );
        }

        return false;
      }
    );

    if (taggedTemplateExpressionsWithAttrs.length) {
      convertStyledAttrsToComponent({
        j,
        plugins,
        expressions: taggedTemplateExpressionsWithAttrs,
        compiledLocalStyledName: compiledLocalStyledNameAfterVisitor,
      });
    }
  }

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
