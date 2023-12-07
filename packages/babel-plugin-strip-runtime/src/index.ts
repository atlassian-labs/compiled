import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, parse } from 'path';

import { declare } from '@babel/helper-plugin-utils';
import template from '@babel/template';
import type { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { sort } from '@compiled/css';
import { preserveLeadingComments } from '@compiled/utils';

import type { PluginPass, PluginOptions, BabelFileMetadata } from './types';
import { getClassicJsxPragma } from './utils/get-jsx-pragma';
import { isAutomaticRuntime } from './utils/is-automatic-runtime';
import { isCCComponent } from './utils/is-cc-component';
import { isCreateElement } from './utils/is-create-element';
import { removeStyleDeclarations } from './utils/remove-style-declarations';
import { toURIComponent } from './utils/to-uri-component';

const FindJsxPragmaImport: Visitor<PluginPass> = {
  ImportSpecifier(path, state) {
    const specifier = path.node;

    t.assertImportDeclaration(path.parent);
    // We don't care about other libraries
    if (path.parent.source.value !== '@compiled/react') return;

    if (
      (specifier.imported.type === 'StringLiteral' && specifier.imported.value === 'jsx') ||
      (specifier.imported.type === 'Identifier' && specifier.imported.name === 'jsx')
    ) {
      // Hurrah, we know that the jsx function in the JSX pragma refers to the
      // jsx function from Compiled.
      state.jsxPragmaIsCompiled = true;

      // Remove the jsx import; the assumption is that we removed the classic JSX pragma, so
      // Babel shouldn't convert React.createElement to the jsx function anymore.
      path.remove();
      return;
    }
  },
};

export default declare<PluginPass>((api) => {
  api.assertVersion(7);

  return {
    name: '@compiled/babel-plugin-strip-runtime',
    pre() {
      this.styleRules = [];
    },
    visitor: {
      Program: {
        enter(path, { file }) {
          const classicJsxPragma = getClassicJsxPragma(file.ast.comments);
          this.classicJsxPragmaName = classicJsxPragma?.name;
          if (!this.classicJsxPragmaName) return;

          path.traverse<PluginPass>(FindJsxPragmaImport, this);

          // Delete comment so that @babel/preset-react doesn't see it and convert all of the
          // React.createElement function calls to jsx function calls
          if (classicJsxPragma?.comment && this.jsxPragmaIsCompiled) {
            file.ast.comments = file.ast.comments?.filter(
              (comment) => comment !== classicJsxPragma.comment
            );
            // Babel provides no way for us to traverse comments >:(
            //
            // So the best we can do is guess that the JSX pragma is probably at the start of
            // the file.
            if (path.node.body[0].leadingComments) {
              path.node.body[0].leadingComments = path.node.body[0].leadingComments.filter(
                (comment) => comment !== classicJsxPragma.comment
              );
            }
          }
        },

        exit(path, { file, filename }) {
          if (!filename) {
            throw new Error(
              `@compiled/babel-plugin-strip-runtime expected the filename not to be empty, but actually got '${filename}'.`
            );
          }

          if (this.opts.compiledRequireExclude) {
            // Rather than inserting styleRules to the code, inserting them to metadata in the case like SSR
            if (!file.metadata?.styleRules) file.metadata.styleRules = [];
            this.styleRules.forEach((rule) => {
              file.metadata.styleRules.push(rule);
            });
            return;
          }

          if (this.opts.styleSheetPath) {
            preserveLeadingComments(path);
            this.styleRules.forEach((rule) => {
              // Each found atomic rule will create a new import that uses the styleSheetPath provided.
              // The benefit is two fold:
              // (1) thread safe collection of styles
              // (2) caching -- resulting in faster builds (one import per rule!)
              const params = toURIComponent(rule);
              path.unshiftContainer(
                'body',
                template.ast(`require("${this.opts.styleSheetPath}?style=${params}");`)
              );
              // We use require instead of import so it works with both ESM and CJS source.
              // If we used ESM it would blow up with CJS source, unfortunately.
            });
          }

          if (this.opts.extractStylesToDirectory && this.styleRules.length > 0) {
            // Build and sanitize filename of the css file
            const cssFilename = `${parse(filename).name}.compiled.css`;

            if (!file.opts.generatorOpts?.sourceFileName) {
              throw new Error(`Source filename was not defined`);
            }
            const sourceFileName = file.opts.generatorOpts.sourceFileName;
            if (!sourceFileName.includes(this.opts.extractStylesToDirectory.source)) {
              throw new Error(
                `Source directory '${this.opts.extractStylesToDirectory.source}' was not found relative to source file ('${sourceFileName}')`
              );
            }

            // Get the path relative to the working directory
            const relativePath = sourceFileName.slice(
              sourceFileName.indexOf(this.opts.extractStylesToDirectory.source) +
                this.opts.extractStylesToDirectory.source.length
            );

            // Write styles to sibling css file
            const cssFilePath = join(
              this.cwd,
              this.opts.extractStylesToDirectory.dest,
              dirname(relativePath),
              cssFilename
            );
            mkdirSync(dirname(cssFilePath), { recursive: true });
            writeFileSync(cssFilePath, sort(this.styleRules.sort().join('\n')));

            // Add css import to file
            path.unshiftContainer(
              'body',
              t.importDeclaration([], t.stringLiteral(`./${cssFilename}`))
            );
          }
        },
      },

      ImportSpecifier(path) {
        if (t.isIdentifier(path.node.imported) && ['CC', 'CS'].includes(path.node.imported.name)) {
          path.remove();
        }
      },

      JSXElement(path, pass) {
        if (!t.isJSXIdentifier(path.node.openingElement.name)) {
          return;
        }

        const componentName = path.node.openingElement.name.name;
        if (componentName !== 'CC') {
          return;
        }

        const [, compiledStyles, , nodeToReplace] = path.get('children');

        // Before we replace this node with its children we need to go through and remove all the
        // style declarations from the CS call.
        removeStyleDeclarations(compiledStyles.node, path, pass);

        if (t.isJSXExpressionContainer(nodeToReplace.node)) {
          const container = nodeToReplace as NodePath<t.JSXExpressionContainer>;
          path.replaceWith(container.node.expression);
        } else {
          path.replaceWith(nodeToReplace);
        }

        // All done! Let's replace this node with the user land child.
        path.node.leadingComments = null;
        return;
      },

      CallExpression(path, pass) {
        const callee = path.node.callee;
        if (isCreateElement(callee)) {
          // We've found something that looks like React.createElement(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!isCCComponent(component)) {
            return;
          }

          const [, , compiledStyles, nodeToReplace] = path.get('arguments');

          // Before we replace this node with its children we need to go through and remove all the
          // style declarations from the CS call.
          removeStyleDeclarations(compiledStyles.node, path, pass);

          // All done! Let's replace this node with the user land child.
          path.node.leadingComments = null;
          path.replaceWith(nodeToReplace);
          return;
        }

        if (isAutomaticRuntime(path.node, 'jsxs')) {
          // We've found something that looks like _jsxs(...)
          // Now we want to check if it's from the Compiled Runtime and if it is - replace with its children.
          const component = path.node.arguments[0];
          if (!isCCComponent(component)) {
            return;
          }

          const [, props] = path.get('arguments');
          if (!t.isObjectExpression(props.node)) {
            return;
          }

          const children = props.node.properties.find((prop): prop is t.ObjectProperty => {
            return (
              t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'children'
            );
          });

          if (!children || !t.isArrayExpression(children.value)) {
            return;
          }

          const [compiledStyles, nodeToReplace] = children.value.elements;
          if (!t.isExpression(nodeToReplace) || !t.isExpression(compiledStyles)) {
            throw new Error('Nodes should be expressions.');
          }

          // Before we replace this node with its children we need to go through and remove all the
          // style declarations from the CS call.
          removeStyleDeclarations(compiledStyles, path, pass);

          // All done! Let's replace this node with the user land child.
          path.node.leadingComments = null;
          path.replaceWith(nodeToReplace);
          return;
        }
      },
    },
  };
});

export { PluginOptions, BabelFileMetadata };
