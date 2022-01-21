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

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
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
          j,
          plugins,
          expressions: taggedTemplateExpressionsWithAttrs,
          compiledLocalStyledName,
        });
      }
    }
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
