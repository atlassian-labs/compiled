import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, parse } from 'path';

import { declare } from '@babel/helper-plugin-utils';
import template from '@babel/template';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { sort } from '@compiled/css';
import { preserveLeadingComments } from '@compiled/utils';

import type { PluginPass, PluginOptions, BabelFileMetadata } from './types';
import { isAutomaticRuntime } from './utils/is-automatic-runtime';
import { isCCComponent } from './utils/is-cc-component';
import { isCreateElement } from './utils/is-create-element';
import { removeStyleDeclarations } from './utils/remove-style-declarations';
import { toURIComponent } from './utils/to-uri-component';

export default declare<PluginPass>((api) => {
  api.assertVersion(7);

  return {
    name: '@compiled/babel-plugin-strip-runtime',
    pre() {
      this.styleRules = [];
    },
    visitor: {
      Program: {
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

            const sortConfig = {
              sortAtRulesEnabled: this.opts.sortAtRules,
              sortShorthandEnabled: this.opts.sortShorthand,
            };

            writeFileSync(cssFilePath, sort(this.styleRules.sort().join('\n'), sortConfig));

            // Add css import to file
            path.unshiftContainer(
              'body',
              t.importDeclaration([], t.stringLiteral(`./${cssFilename}`))
            );
          }
        },
      },

      ImportSpecifier(path) {
        // Strip both the React-mode style components (`CC`, `CS`) and the
        // vanilla-mode style inserter (`insertSheets`). After extraction
        // these imports are dead code: their effect has been moved to a
        // sibling `.compiled.css` file (or to `pass.styleRules` for SSR
        // consumers).
        if (
          t.isIdentifier(path.node.imported) &&
          ['CC', 'CS', 'insertSheets'].includes(path.node.imported.name)
        ) {
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

        // Vanilla mode: hoist the rules out of `insertSheets([...])` into
        // `pass.styleRules` (so they participate in extraction the same way as
        // rules from `<CC><CS>`), then remove the call entirely.
        if (
          t.isIdentifier(callee) &&
          callee.name === 'insertSheets' &&
          path.node.arguments.length === 1 &&
          t.isArrayExpression(path.node.arguments[0])
        ) {
          const sheets: string[] = [];
          for (const element of path.node.arguments[0].elements) {
            if (!t.isStringLiteral(element)) {
              // Bail out — leave the call alone if the argument isn't a
              // statically extractable string array. This keeps the runtime
              // behaviour correct in the rare cases where an unrelated
              // function happens to share the name `insertSheets`.
              return;
            }
            sheets.push(element.value);
          }
          pass.styleRules.push(...sheets);
          path.remove();
          return;
        }

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
