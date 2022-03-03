import type { API, FileInfo, Options, Program, TaggedTemplateExpression } from 'jscodeshift';

import { COMPILED_IMPORT_PATH } from '../../constants';
import defaultCodemodPlugin from '../../plugins/default';
import type { CodemodPluginInstance } from '../../plugins/types';
import {
  addCommentForUnresolvedImportSpecifiers,
  applyVisitor,
  convertMixedImportToNamedImport,
  hasImportDeclaration,
  withPlugin,
} from '../../utils';

import { convertStyledAttrsToComponent } from './utils';

const imports = {
  compiledStyledImportName: 'styled',
  styledComponentsPackageName: 'styled-components',
  styledComponentsSupportedImportNames: ['css', 'keyframes'],
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
    collection,
    importPath: imports.styledComponentsPackageName,
    j,
  });

  if (!hasStyledComponentsImportDeclaration) {
    return source;
  }

  addCommentForUnresolvedImportSpecifiers({
    allowedImportSpecifierNames: imports.styledComponentsSupportedImportNames,
    collection,
    importPath: imports.styledComponentsPackageName,
    j,
  });

  convertMixedImportToNamedImport({
    allowedImportSpecifierNames: imports.styledComponentsSupportedImportNames,
    collection,
    defaultSourceSpecifierName: imports.compiledStyledImportName,
    importPath: imports.styledComponentsPackageName,
    j,
    plugins,
  });

  applyVisitor({
    currentProgram: collection.find(j.Program).get(),
    originalProgram,
    plugins,
  });

  const styledImports = collection.find(
    j.ImportSpecifier,
    (specifier) => specifier.imported.name === 'styled'
  );

  styledImports.forEach((styledImport) => {
    const isCompiledImport =
      styledImport?.parentPath?.parentPath.value.source.value === COMPILED_IMPORT_PATH;

    if (isCompiledImport) {
      const compiledLocalStyledName = styledImport.value.local?.name || 'styled';

      const taggedTemplateExpressionsWithAttrs = collection.find(
        j.TaggedTemplateExpression,
        ({ tag }: TaggedTemplateExpression) => {
          if (tag.type === 'CallExpression') {
            const { callee } = tag;

            return (
              callee.type === 'MemberExpression' &&
              callee.object.type === 'MemberExpression' &&
              callee.object.object.type === 'Identifier' &&
              callee.object.object.name === compiledLocalStyledName &&
              callee.property.type === 'Identifier' &&
              callee.property.name === 'attrs'
            );
          }

          return false;
        }
      );

      if (taggedTemplateExpressionsWithAttrs.length) {
        convertStyledAttrsToComponent({
          compiledLocalStyledName,
          expressions: taggedTemplateExpressionsWithAttrs,
          j,
          plugins,
        });
      }
    }
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
