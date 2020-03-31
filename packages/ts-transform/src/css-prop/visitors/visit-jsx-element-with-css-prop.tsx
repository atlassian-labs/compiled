import * as ts from 'typescript';
import { stylis } from '../../utils/stylis';
import { Declarations, CssVariableExpressions } from '../../types';
import { classNameHash } from '../../utils/hash';
import { objectLiteralToCssString } from '../../utils/object-literal-to-css';
import { templateLiteralToCss } from '../../utils/template-literal-to-css';
import { joinToJsxExpression } from '../../utils/expression-operators';
import * as logger from '../../utils/log';
import {
  getIdentifierText,
  getJsxNodeAttributes,
  getJsxNodeAttributesValue,
  createNodeError,
} from '../../utils/ast-node';

const CSS_PROP = 'css';
const CLASSNAME_PROP = 'className';
const STYLE_ATTRIBUTE_NAME = 'style';
const HASH_ATTRIBUTE_NAME = 'hash';

const getStyleElementName = (isCommonJs: boolean) =>
  isCommonJs
    ? (ts.createPropertyAccess(
        ts.createIdentifier('css_in_js_1'),
        ts.createIdentifier('Style')
      ) as ts.JsxTagNamePropertyAccess)
    : ts.createIdentifier('Style');

export const visitJsxElementWithCssProp = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  variableDeclarations: Declarations,
  context: ts.TransformationContext
) => {
  logger.log('visiting a jsx element with a css prop');

  // Grab the css prop node
  const cssJsxAttribute = getJsxNodeAttributes(node).properties.find(
    prop => ts.isJsxAttribute(prop) && prop.name.escapedText === CSS_PROP
  ) as ts.JsxAttribute;

  if (!cssJsxAttribute || !cssJsxAttribute.initializer) {
    throw createNodeError(
      'Css prop should have been defined. Check a level higher in the code.',
      node
    );
  }

  let cssToPassThroughCompiler: string = '';
  let cssVariables: CssVariableExpressions[] = [];

  if (ts.isStringLiteral(cssJsxAttribute.initializer)) {
    // static string literal found e.g. css="font-size: 20px;"
    cssToPassThroughCompiler = cssJsxAttribute.initializer.text;
  } else if (!cssJsxAttribute.initializer.expression) {
    // expression was empty e.g. css={}
    // do nothing
  } else if (
    ts.isTemplateExpression(cssJsxAttribute.initializer.expression) ||
    ts.isNoSubstitutionTemplateLiteral(cssJsxAttribute.initializer.expression)
  ) {
    // string literal found with substitutions e.g. css={`color: ${color}`}
    const processed = templateLiteralToCss(
      cssJsxAttribute.initializer.expression,
      variableDeclarations,
      context
    );
    cssVariables = processed.cssVariables;
    cssToPassThroughCompiler = processed.css;
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

  const className = classNameHash(cssToPassThroughCompiler);
  const suppliedClassNameAttribute = getJsxNodeAttributesValue(node, CLASSNAME_PROP);

  let classNameInitializer: ts.JsxExpression | ts.StringLiteral = ts.createStringLiteral(className);

  if (suppliedClassNameAttribute && ts.isJsxExpression(suppliedClassNameAttribute)) {
    classNameInitializer = joinToJsxExpression(
      ts.createStringLiteral(className),
      suppliedClassNameAttribute.expression!
    );
  } else if (suppliedClassNameAttribute && ts.isStringLiteral(suppliedClassNameAttribute)) {
    classNameInitializer = joinToJsxExpression(
      ts.createStringLiteral(className),
      suppliedClassNameAttribute
    );
  }

  const attributedNode = ts.isJsxSelfClosingElement(node) ? node : node.openingElement;

  const previousStyleAttribute = attributedNode.attributes.properties.filter(
    prop => prop.name && getIdentifierText(prop.name) === STYLE_ATTRIBUTE_NAME
  )[0];
  let previousStyleProps: ts.ObjectLiteralElementLike[] = [];

  if (
    previousStyleAttribute &&
    ts.isJsxAttribute(previousStyleAttribute) &&
    previousStyleAttribute.initializer &&
    ts.isJsxExpression(previousStyleAttribute.initializer) &&
    previousStyleAttribute.initializer.expression &&
    ts.isObjectLiteralExpression(previousStyleAttribute.initializer.expression)
  ) {
    previousStyleProps = previousStyleAttribute.initializer.expression.properties.map(x => x);
  }

  const attributes = [
    // Filter out css prop, carry over others
    ...attributedNode.attributes.properties.filter(
      prop =>
        prop.name &&
        getIdentifierText(prop.name) !== CSS_PROP &&
        getIdentifierText(prop.name) !== CLASSNAME_PROP &&
        getIdentifierText(prop.name) !== STYLE_ATTRIBUTE_NAME
    ),
    // Reference style via className
    ts.createJsxAttribute(ts.createIdentifier('className'), classNameInitializer),

    // Add a style prop if css variables are applied
    cssVariables.length
      ? ts.createJsxAttribute(
          ts.createIdentifier(STYLE_ATTRIBUTE_NAME),
          ts.createJsxExpression(
            undefined,
            ts.createObjectLiteral(
              previousStyleProps.concat(
                cssVariables.map(cssVariable =>
                  ts.createPropertyAssignment(
                    ts.createStringLiteral(cssVariable.name),
                    cssVariable.expression
                  )
                )
              )
            )
          )
        )
      : undefined,
  ].filter(
    (item): item is ts.JsxAttribute => typeof item !== 'undefined' && ts.isJsxAttribute(item)
  );

  const compiledCss: string[] = stylis(`.${className}`, cssToPassThroughCompiler);
  const STYLE_ELEMENT_NAME = getStyleElementName(
    context.getCompilerOptions().module === ts.ModuleKind.CommonJS
  );

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        STYLE_ELEMENT_NAME,
        [],
        ts.createJsxAttributes([
          ts.createJsxAttribute(
            ts.createIdentifier(HASH_ATTRIBUTE_NAME),
            ts.createStringLiteral(className)
          ),
        ])
      ),
      node
    ),

    [
      ts.createJsxExpression(
        undefined,
        ts.createArrayLiteral(
          compiledCss.map(rule => ts.createStringLiteral(rule)),
          false
        )
      ),
    ],

    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(STYLE_ELEMENT_NAME), node)
  );

  // Create a new fragment that will wrap both the style and the node we found initially.
  const newFragmentParent = ts.createJsxFragment(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxOpeningFragment(), node),
    [
      // important that the style goes before the node
      styleNode,
      ts.isJsxSelfClosingElement(node)
        ? ts.setOriginalNode(
            ts.createJsxSelfClosingElement(
              node.tagName,
              node.typeArguments,
              ts.createJsxAttributes(attributes)
            ),
            node
          )
        : ts.createJsxElement(
            ts.setOriginalNode(
              ts.createJsxOpeningElement(
                node.openingElement.tagName,
                node.openingElement.typeArguments,
                ts.createJsxAttributes(attributes)
              ),
              node
            ),
            node.children,
            ts.setOriginalNode(ts.createJsxClosingElement(node.closingElement.tagName), node)
          ),
    ],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxJsxClosingFragment(), node)
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
