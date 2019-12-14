import * as ts from 'typescript';
import stylis from 'stylis';
import { VariableDeclarations, CssVariableExpressions } from './types';
import { nextClassName } from '../utils/identifiers';
import { objectLiteralToCssString } from './utils/object-literal-to-css';
import * as logger from '../utils/log';

const CSS_PROP = 'css';

const getJsxNodeAttributes = (node: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxAttributes => {
  if ('attributes' in node) {
    return node.attributes;
  }

  return node.openingElement.attributes;
};

export const visitJsxElementWithCssProp = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  variableDeclarations: VariableDeclarations
) => {
  logger.log('visiting a jsx element with a css prop');

  // Grab the css prop node
  const cssJsxAttribute = getJsxNodeAttributes(node).properties.find(
    prop => ts.isJsxAttribute(prop) && prop.name.getText() === CSS_PROP
  ) as ts.JsxAttribute;

  if (!cssJsxAttribute || !cssJsxAttribute.initializer) {
    throw new Error('Css prop should have been defined. Check a level higher in the code.');
  }

  let cssToPassThroughCompiler: string = '';
  let cssVariables: CssVariableExpressions[] = [];

  if (ts.isStringLiteral(cssJsxAttribute.initializer)) {
    // static string literal found e.g. css="font-size: 20px;"
    cssToPassThroughCompiler = cssJsxAttribute.initializer.getText();
  } else if (!cssJsxAttribute.initializer.expression) {
    // expression was empty e.g. css={}
    // do nothing
  } else if (ts.isNoSubstitutionTemplateLiteral(cssJsxAttribute.initializer.expression)) {
    // static string literal found e.g. css={`font-size: 20px;`}
    cssToPassThroughCompiler = cssJsxAttribute.initializer.expression.getText();
  } else if (ts.isObjectLiteralExpression(cssJsxAttribute.initializer.expression)) {
    // object literal found e..g css={{ fontSize: '20px' }}
    const processedCssObject = objectLiteralToCssString(
      cssJsxAttribute.initializer.expression,
      variableDeclarations
    );
    cssVariables = processedCssObject.cssVariables;
    cssToPassThroughCompiler = processedCssObject.css;
  } else {
    // console.log(cssJsxAttribute.initializer.expression.getText());
    logger.log('unsupported value in css prop');
    // how do we handle mixins/function expressions?
    // can we execute functions somehow?
    // css prop TODO:
    // - tagged templates with variables e.g. css={`color: ${redVar};`}
    // - function expressions e.g. css={functionCall}
    // - spreading values as props e.g. css={{ ...mixin, color: 'red' }}
    // - remove types from object literals e.g. 'blah' as const - remove as const.
  }

  const className = nextClassName();
  const nodeToTransform = ts.getMutableClone(node);
  const mutableNodeAttributes = getJsxNodeAttributes(nodeToTransform);
  (mutableNodeAttributes.properties as any) = mutableNodeAttributes.properties.filter(
    prop => prop.name && prop.name.getText() !== CSS_PROP
  );
  (mutableNodeAttributes.properties as any).push(
    ts.createJsxAttribute(ts.createIdentifier('className'), ts.createStringLiteral(className))
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

  const compiledCss = stylis(`.${className}`, cssToPassThroughCompiler);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    ts.createJsxOpeningElement(ts.createIdentifier('style'), [], ts.createJsxAttributes([])),
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

  logger.log('returning fragment with style and parsed jsx element with css prop');

  return newFragmentParent;
};

export const isJsxElementWithCssProp = (
  node: ts.Node
): node is ts.JsxElement | ts.JsxSelfClosingElement => {
  return !!(
    (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
    getJsxNodeAttributes(node).properties.find(
      prop => ts.isJsxAttribute(prop) && prop.name.text === CSS_PROP
    )
  );
};
