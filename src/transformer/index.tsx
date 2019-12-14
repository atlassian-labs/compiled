import * as ts from 'typescript';
import stylis from 'stylis';
import kebabCase from './utils/kebab-case';
import * as log from './utils/log';
import SequentialCharacterGenerator from './utils/sequential-chars';
import { name as packageName } from '../../package.json';

const JSX_PRAGMA = 'jsx';
const CSS_PROP = 'css';
const UNCOMPILED_GUARD_NAME = 'IS_CSS_FREEDOM_COMPILED';

const getJsxNodeAttributes = (node: ts.JsxElement | ts.JsxSelfClosingElement) => {
  if ('attributes' in node) {
    return node.attributes;
  }

  return node.openingElement.attributes;
};

const isCssFreedomCompiledNode = (node: ts.Node): node is ts.VariableDeclaration => {
  return ts.isVariableDeclaration(node) && node.name.getText() === UNCOMPILED_GUARD_NAME;
};

const isJsxWithCssProp = (node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement => {
  return !!(
    (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
    getJsxNodeAttributes(node).properties.find(
      prop => ts.isJsxAttribute(prop) && prop.name.getText() === CSS_PROP
    )
  );
};

interface CssVariable {
  name: string;
  expression: ts.Expression;
}

interface ProcessOpts {
  cssVariableIds: SequentialCharacterGenerator;
  scopedVariables: VariableStore;
}

const processCssProperties = (
  objectLiteral: ts.ObjectLiteralExpression,
  { cssVariableIds, scopedVariables }: ProcessOpts
) => {
  const properties = objectLiteral.properties;
  let cssVariables: CssVariable[] = [];

  const css: string = properties.reduce((acc, prop) => {
    // if is spread
    // if (ts.isSpreadAssignment(prop.initializer)) {
    //   // Ok it's a spread e.g. "...prop"

    //   // Reference to the identifier that we are spreading in, e.g. "prop".
    //   const objectReferenceNode = scopedVariables[prop.expression.getText()];
    //   if (!objectReferenceNode) {
    //     throw new Error('variable doesnt exist in scope');
    //   }
    //   // Spread can either be from an object, or a function. Probably not an array.

    //   const result = processCssProperties(objectReferenceNode.initializer.properties, {
    //     cssVariableIds,
    //     scopedVariables,
    //   });
    //   cssVariables = cssVariables.concat(result.cssVariables);

    //   return `${acc}
    //   ${result.css}
    //   `;
    // }

    const key = kebabCase(prop.getText());
    let value;

    if (
      ts.isShorthandPropertyAssignment(prop) ||
      (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.initializer))
    ) {
      // We have a prop assignment using a variable, e.g. "fontSize: props.fontSize" or "fontSize".
      // Time to turn it into a css variable.
      const cssVariable = `--${key}-${cssVariableIds.next()}`;
      value = `var(${cssVariable});`;
      cssVariables.push({
        name: cssVariable,
        expression: 'initializer' in prop ? prop.initializer : prop.name,
      });
    } else if (ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer)) {
      const result = processCssProperties(prop.initializer, {
        cssVariableIds,
        scopedVariables,
      });
      cssVariables = cssVariables.concat(result.cssVariables);

      return `${acc}
      ${key} {
        ${result.css}
      }
      `;
    } else if (ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer)) {
      // We have a regular static assignment, e.g. "fontSize: '20px'"
      value = `${prop.initializer.getText()}`;
    } else {
      throw new Error('unsupported value in css prop object');
    }

    return `${acc}
      ${key}: ${value}`;
  }, '');

  return {
    cssVariables,
    css,
  };
};

interface VariableStore {
  [moduleName: string]: ts.Node;
}

interface TransformerOptions {
  debug?: boolean;
}

export default function transformer({ debug }: TransformerOptions = {}) {
  log.setEnabled(!!debug);
  log.log(`typescript transformer has been enabled and has debug is \`true\`.`);

  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    const classNameIds = new SequentialCharacterGenerator();
    const cssVariableIds = new SequentialCharacterGenerator();

    return sourceFile => {
      const foundVariables: VariableStore = {};
      let rootNode = sourceFile;
      let needsCssTransform = false;

      if (
        // Only continue if the jsx pragma is enabled.
        // localJsxNamespace not found???
        (rootNode as any).localJsxNamespace === JSX_PRAGMA &&
        // Only continue if we've found an import for this pkg.
        rootNode.statements.find(
          statement =>
            ts.isImportDeclaration(statement) &&
            ((statement.moduleSpecifier && statement.moduleSpecifier.getText() === packageName) ||
              // Hack for local development
              (statement.moduleSpecifier && statement.moduleSpecifier.getText() === '../src'))
        )
      ) {
        log.log('file needs to be transformed');

        needsCssTransform = true;
      }

      if (
        needsCssTransform &&
        // Only add React if it's not found.
        !rootNode.statements.find(
          statement =>
            ts.isImportDeclaration(statement) &&
            statement.importClause &&
            statement.importClause.name &&
            statement.importClause.name.getText() === 'React'
        )
      ) {
        // Okay so React doesn't exist anywhere. But the 'react' import could still be around. Let's do another search.
        const reactImportNode: ts.ImportDeclaration | undefined = rootNode.statements.find(
          statement => {
            return (
              ts.isImportDeclaration(statement) && statement.moduleSpecifier.getText() === 'react'
            );
          }
        ) as ts.ImportDeclaration;

        if (reactImportNode) {
          log.log('react module found, ensuring it has a default export');

          // Ok it exists, lets ensure it has the default export as "React".
          rootNode = ts.updateSourceFileNode(rootNode, [
            ts.createImportDeclaration(
              /* decorators */ undefined,
              /* modifiers */ undefined,
              ts.createImportClause(
                ts.createIdentifier('React'),
                reactImportNode.importClause && reactImportNode.importClause.namedBindings
              ),
              ts.createLiteral('react')
            ),
            ...rootNode.statements,
          ]);
        } else {
          log.log('react module not found, adding it');

          rootNode = ts.updateSourceFileNode(rootNode, [
            ts.createImportDeclaration(
              /* decorators */ undefined,
              /* modifiers */ undefined,
              ts.createImportClause(ts.createIdentifier('React'), undefined),
              ts.createLiteral('react')
            ),
            ...rootNode.statements,
          ]);
        }
      }

      const visitor = (node: ts.Node): ts.Node => {
        if (!needsCssTransform && isCssFreedomCompiledNode(node)) {
          log.log(`setting ${UNCOMPILED_GUARD_NAME} variable to true`);

          // Reassign the variable declarations to `true` so it doesn't blow up at runtime.
          const newNode = ts.updateVariableDeclaration(
            node,
            ts.createIdentifier(node.name.getText()),
            ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ts.createTrue()
          );

          return newNode;
        }

        if (!needsCssTransform) {
          return node;
        }

        if (ts.isVariableDeclaration(node)) {
          // we may need this later, let's store it in a basic object for quick access.
          foundVariables[node.name.getText()] = node;
          return ts.visitEachChild(node, visitor, context);
        }

        if (isJsxWithCssProp(node)) {
          // Grab the css prop node
          const cssJsxAttribute = getJsxNodeAttributes(node).properties.find(
            prop => ts.isJsxAttribute(prop) && prop.name.getText() === CSS_PROP
          ) as ts.JsxAttribute;
          const cssPropExpression = cssJsxAttribute.initializer;

          log.log('processing css');

          // Compile the CSS from the styles object node.
          const className = classNameIds.next();
          let compiledCss;
          let cssVariables: CssVariable[] = [];

          if (!cssPropExpression) {
            // Do nothing.
          } else if (ts.isObjectLiteralExpression(cssPropExpression)) {
            // object literal found e..g css={{ fontSize: '20px' }}
            const processedCssObject = processCssProperties(cssPropExpression, {
              cssVariableIds,
              scopedVariables: foundVariables,
            });
            cssVariables = processedCssObject.cssVariables;
            compiledCss = stylis(`.${className}`, processedCssObject.css);
          } else if (
            // static string literal found e.g. css={`font-size: 20px;`}
            ts.isNoSubstitutionTemplateLiteral(cssPropExpression)
          ) {
            compiledCss = stylis(`.${className}`, cssPropExpression.getText());
          } else {
            throw new Error('unsupported value in css prop');
            // how do we handle mixins/function expressions?
            // can we execute functions somehow?

            // css prop TODO:
            // - tagged templates with variables e.g. css={`color: ${redVar};`}
            // - function expressions e.g. css={functionCall}
            // - spreading values as props e.g. css={{ ...mixin, color: 'red' }}
            // - remove types from object literals e.g. 'blah' as const - remove as const.
          }

          log.log('removing css prop');

          // Remove css prop from the react element.
          const nodeToTransform = ts.getMutableClone(node);
          const mutableNodeAttributes = getJsxNodeAttributes(nodeToTransform);

          (mutableNodeAttributes.properties as any) = mutableNodeAttributes.properties.filter(
            prop => prop.name && prop.name.getText() !== CSS_PROP
          );
          (mutableNodeAttributes.properties as any).push(
            ts.createJsxAttribute(
              ts.createIdentifier('className'),
              ts.createStringLiteral(className)
            )
          );

          if (cssVariables.length) {
            (mutableNodeAttributes.properties as any).push(
              ts.createJsxAttribute(
                ts.createIdentifier('style'),
                ts.createJsxExpression(
                  undefined,
                  ts.createObjectLiteral(
                    cssVariables.map(variable => {
                      return ts.createPropertyAssignment(
                        ts.createStringLiteral(variable.name),
                        variable.expression
                      );
                    }),
                    false
                  )
                )
              )
            );
          }

          // Create the style element that will precede the node that had the css prop.
          const styleNode = ts.createJsxElement(
            ts.createJsxOpeningElement(
              ts.createIdentifier('style'),
              [],
              ts.createJsxAttributes([])
            ),
            [ts.createJsxText(compiledCss)],
            ts.createJsxClosingElement(ts.createIdentifier('style'))
          );

          // Create a new fragment that will wrap both the style and the node we found initially.
          const newFragmentParent = ts.createJsxFragment(
            ts.createJsxOpeningFragment(),
            [
              // important that the style goes before the node
              styleNode,
              nodeToTransform,
            ],
            ts.createJsxJsxClosingFragment()
          );

          log.log('returning composed component with fragment');

          // TODO: Why does const/let blow up but not var?????
          return ts.visitEachChild(newFragmentParent, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(rootNode, visitor);
    };
  };

  return transformerFactory;
}
