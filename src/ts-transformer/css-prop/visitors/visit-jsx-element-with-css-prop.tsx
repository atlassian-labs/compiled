import * as ts from 'typescript';
import stylis from 'stylis';
import { VariableDeclarations, CssVariableExpressions } from '../../types';
import { nextClassName } from '../../utils/identifiers';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import * as logger from '../../utils/log';
import { getIdentifierText, getJsxNodeAttributes } from '../../utils/ast-node';

const CSS_PROP = 'css';

export const visitJsxElementWithCssProp = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  variableDeclarations: VariableDeclarations,
  context: ts.TransformationContext
) => {
  logger.log('visiting a jsx element with a css prop');

  // Grab the css prop node
  const cssJsxAttribute = getJsxNodeAttributes(node).properties.find(
    prop => ts.isJsxAttribute(prop) && prop.name.escapedText === CSS_PROP
  ) as ts.JsxAttribute;

  if (!cssJsxAttribute || !cssJsxAttribute.initializer) {
    throw new Error('Css prop should have been defined. Check a level higher in the code.');
  }

  let cssToPassThroughCompiler: string = '';
  let cssVariables: CssVariableExpressions[] = [];

  if (ts.isStringLiteral(cssJsxAttribute.initializer)) {
    // static string literal found e.g. css="font-size: 20px;"
    cssToPassThroughCompiler = cssJsxAttribute.initializer.text;
  } else if (!cssJsxAttribute.initializer.expression) {
    // expression was empty e.g. css={}
    // do nothing
  } else if (ts.isTemplateExpression(cssJsxAttribute.initializer.expression)) {
    // string literal found with substitutions e.g. css={`color: ${color}`}
    const processed = templateLiteralToCss(
      cssJsxAttribute.initializer.expression,
      variableDeclarations,
      context
    );
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else if (ts.isNoSubstitutionTemplateLiteral(cssJsxAttribute.initializer.expression)) {
    // static string literal found e.g. css={`font-size: 20px;`}
    cssToPassThroughCompiler = cssJsxAttribute.initializer.expression.text;
  } else if (ts.isObjectLiteralExpression(cssJsxAttribute.initializer.expression)) {
    // object literal found e.g css={{ fontSize: '20px' }}
    const processed = objectLiteralToCssString(
      cssJsxAttribute.initializer.expression,
      variableDeclarations,
      context
    );
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
  } else {
    logger.log('unsupported value in css prop');
    // how do we handle mixins/function expressions?
    // can we execute functions somehow?
    // css prop TODO:
    // - function expressions e.g. css={functionCall}
  }

  const className = nextClassName();
  const nodeToTransform = ts.getMutableClone(node);
  const mutableNodeAttributes = getJsxNodeAttributes(nodeToTransform);
  (mutableNodeAttributes.properties as any) = mutableNodeAttributes.properties.filter(
    prop => prop.name && getIdentifierText(prop.name) !== CSS_PROP
  );
  const classNameIdentifier = ts.createIdentifier('className');
  const classNameStringLiteral = ts.createStringLiteral(className);
  const newClassNameAttribute = ts.createJsxAttribute(classNameIdentifier, classNameStringLiteral);
  classNameStringLiteral.parent = newClassNameAttribute;
  classNameIdentifier.parent = newClassNameAttribute;
  newClassNameAttribute.parent = mutableNodeAttributes;
  (mutableNodeAttributes.properties as any).push(newClassNameAttribute);

  if (cssVariables.length) {
    const identifier = ts.createIdentifier('style');
    const styleObjectLiteral = ts.createObjectLiteral(
      cssVariables.map(variable => {
        const propy = ts.createStringLiteral(variable.name);
        const refy = ts.createIdentifier(getIdentifierText(variable.identifier));
        const assignment = ts.createPropertyAssignment(propy, refy);

        propy.parent = assignment;
        refy.parent = assignment;
        assignment.parent = styleObjectLiteral;

        return assignment;
      }),
      false
    );
    const expression = ts.createJsxExpression(undefined, styleObjectLiteral);
    const newStyleAttribute = ts.createJsxAttribute(identifier, expression);

    styleObjectLiteral.parent = expression;
    identifier.parent = newStyleAttribute;
    expression.parent = newStyleAttribute;
    newStyleAttribute.parent = mutableNodeAttributes;
    (mutableNodeAttributes.properties as any).push(newStyleAttribute);
  }

  const compiledCss = stylis(`.${className}`, cssToPassThroughCompiler);

  // Create the style element that will precede the node that had the css prop.

  const text = ts.createJsxText(compiledCss);
  const styleId = ts.createIdentifier('style');
  const styleIdd = ts.createIdentifier('style');
  const emptyJsx = ts.createJsxAttributes([]);
  const styleOpen = ts.createJsxOpeningElement(styleId, [], emptyJsx);
  const styleClose = ts.createJsxClosingElement(styleIdd);
  const styleNode = ts.createJsxElement(styleOpen, [text], styleClose);

  emptyJsx.parent = styleOpen;
  styleIdd.parent = styleClose;
  styleId.parent = styleOpen;
  styleOpen.parent = styleNode;
  styleClose.parent = styleNode;
  text.parent = styleNode;

  const open = ts.createJsxOpeningFragment();
  const close = ts.createJsxJsxClosingFragment();

  // Create a new fragment that will wrap both the style and the node we found initially.
  const newFragmentParent = ts.createJsxFragment(
    open,
    [
      // important that the style goes before the node
      styleNode,
      nodeToTransform,
    ],
    close
  );

  (open.parent = newFragmentParent), (close.parent = newFragmentParent);

  styleNode.parent = newFragmentParent;
  newFragmentParent.parent = node.parent;
  nodeToTransform.parent = newFragmentParent;

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
