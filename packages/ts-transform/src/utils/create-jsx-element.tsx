import * as ts from 'typescript';
import { stylis } from './stylis';
import { classNameHash } from './hash';
import { getJsxNodeAttributes, getJsxNodeAttributesValue, getIdentifierText } from './ast-node';
import { joinToJsxExpression } from './expression-operators';
import { CssVariableExpressions } from '../types';
import * as constants from '../constants';

interface JsxElementOpts {
  css: string;
  cssVariables: CssVariableExpressions[];
  skipClassName?: boolean;
  styleFactory?: (
    props: ts.PropertyAssignment[]
  ) => (ts.PropertyAssignment | ts.SpreadAssignment)[];
  classNameFactory?: (node: ts.StringLiteral) => ts.StringLiteral | ts.JsxExpression;
  jsxAttributes?: (ts.JsxAttribute | ts.JsxSpreadAttribute)[];
  children?: ts.JsxChild;
  context: ts.TransformationContext;
}

const getRuntimeStyleComponentName = (isCommonJs: boolean) =>
  isCommonJs
    ? (ts.createPropertyAccess(
        ts.createIdentifier(constants.COMMON_JS_COMPILED_IMPORT),
        ts.createIdentifier(constants.COMPILED_STYLE_COMPONENT_NAME)
      ) as ts.JsxTagNamePropertyAccess)
    : ts.createIdentifier(constants.COMPILED_STYLE_COMPONENT_NAME);

const createStyleNode = (node: ts.Node, className: string, css: string[], opts: JsxElementOpts) => {
  const STYLE_ELEMENT_NAME = getRuntimeStyleComponentName(
    opts.context.getCompilerOptions().module === ts.ModuleKind.CommonJS
  );
  return ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        STYLE_ELEMENT_NAME,
        [],
        ts.createJsxAttributes([
          ts.createJsxAttribute(
            ts.createIdentifier(constants.HASH_PROP_NAME),
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
          css.map(rule => ts.createStringLiteral(rule)),
          false
        )
      ),
    ],

    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(STYLE_ELEMENT_NAME), node)
  );
};

const createFragmentNode = (node: ts.Node, styleNode: ts.JsxChild, childNode?: ts.JsxChild) => {
  return ts.createJsxFragment(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxOpeningFragment(), node),

    [
      // important that the style goes before the node
      styleNode,
      childNode,
    ].filter(Boolean) as ts.JsxChild[],

    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxJsxClosingFragment(), node)
  );
};

const cloneJsxElement = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  className: string,
  opts: JsxElementOpts & { propsToRemove?: string[] }
) => {
  const openingJsxElement = ts.isJsxSelfClosingElement(node) ? node : node.openingElement;
  const previousClassNameProp = getJsxNodeAttributesValue(node, constants.CLASSNAME_PROP_NAME);
  let newClassNameProp: ts.JsxExpression | ts.StringLiteral = ts.createStringLiteral(className);

  if (previousClassNameProp && ts.isJsxExpression(previousClassNameProp)) {
    newClassNameProp = joinToJsxExpression(
      ts.createStringLiteral(className),
      previousClassNameProp.expression!
    );
  } else if (previousClassNameProp && ts.isStringLiteral(previousClassNameProp)) {
    newClassNameProp = joinToJsxExpression(
      ts.createStringLiteral(className),
      previousClassNameProp
    );
  }

  const previousStyleProp = openingJsxElement.attributes.properties.find(
    prop => prop.name && getIdentifierText(prop.name) === constants.STYLE_PROP_NAME
  );
  let styleProperties: ts.ObjectLiteralElementLike[] = [];

  if (
    previousStyleProp &&
    ts.isJsxAttribute(previousStyleProp) &&
    previousStyleProp.initializer &&
    ts.isJsxExpression(previousStyleProp.initializer) &&
    previousStyleProp.initializer.expression &&
    ts.isObjectLiteralExpression(previousStyleProp.initializer.expression)
  ) {
    styleProperties = previousStyleProp.initializer.expression.properties.map(x => x);
  }

  const props = [
    // Filter out css prop, carry over others
    ...openingJsxElement.attributes.properties.filter(
      prop =>
        prop.name &&
        !(opts.propsToRemove || []).includes(getIdentifierText(prop.name)) &&
        getIdentifierText(prop.name) !== constants.CLASSNAME_PROP_NAME &&
        getIdentifierText(prop.name) !== constants.STYLE_PROP_NAME
    ),

    // className={}
    ts.createJsxAttribute(ts.createIdentifier(constants.CLASSNAME_PROP_NAME), newClassNameProp),

    // style={}
    opts.cssVariables.length || styleProperties.length
      ? ts.createJsxAttribute(
          ts.createIdentifier(constants.STYLE_PROP_NAME),
          ts.createJsxExpression(
            undefined,
            ts.createObjectLiteral(
              styleProperties.concat(
                opts.cssVariables.map(cssVariable =>
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

  return ts.isJsxSelfClosingElement(node)
    ? ts.setOriginalNode(
        ts.createJsxSelfClosingElement(
          node.tagName,
          node.typeArguments,
          ts.createJsxAttributes(props)
        ),
        node
      )
    : ts.createJsxElement(
        ts.setOriginalNode(
          ts.createJsxOpeningElement(
            node.openingElement.tagName,
            node.openingElement.typeArguments,
            ts.createJsxAttributes(props)
          ),
          node
        ),
        node.children,
        ts.setOriginalNode(ts.createJsxClosingElement(node.closingElement.tagName), node)
      );
};

const createJsxElement = (
  tagName: string,
  className: string,
  opts: JsxElementOpts & { node: ts.Node }
) => {
  const elementNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        ts.createIdentifier(tagName),
        [],
        ts.createJsxAttributes([
          ...(opts.jsxAttributes || []),
          // className should always be last
          ts.createJsxAttribute(
            ts.createIdentifier(constants.CLASSNAME_PROP_NAME),
            opts.classNameFactory
              ? opts.classNameFactory(ts.createStringLiteral(className))
              : ts.createStringLiteral(className)
          ),
        ])
      ),
      opts.node
    ),
    opts.children ? [opts.children] : [],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier(tagName)), opts.node)
  );

  if (opts.cssVariables.length) {
    const styleProps = opts.cssVariables.map(variable => {
      return ts.createPropertyAssignment(
        ts.createStringLiteral(variable.name),
        variable.expression
      );
    });

    const elementNodeAttributes = getJsxNodeAttributes(elementNode);
    (elementNodeAttributes.properties as any).push(
      ts.createJsxAttribute(
        ts.createIdentifier(constants.STYLE_PROP_NAME),
        ts.createJsxExpression(
          undefined,
          ts.createObjectLiteral(
            opts.styleFactory ? opts.styleFactory(styleProps) : styleProps,
            false
          )
        )
      )
    );
  }

  return elementNode;
};

/**
 * Will create a jsx element that passes through `children`.

 * <React.Fragment>
 *  <Style>{[..]}</Style>
 *  {`opts.children`}
 * </React.Fragment>
 */
export const createCompiledFragment = (node: ts.JsxElement, opts: JsxElementOpts) => {
  const className = classNameHash(opts.css);
  const compiledCss: string[] = stylis(opts.skipClassName ? `.${className}` : '', opts.css);

  return createFragmentNode(
    node,
    createStyleNode(node, className, compiledCss, opts),
    opts.children
  );
};

/**
 * Will create a jsx element based on the input `tagName` string.
 *
 * Output:
 *
 * <React.Fragment>
 *   <Style>{[..]}</Style>
 *   <`tagName`>{`opts.children`}</`tagName`>
 * </React.Fragment>
 */
export const createCompiledComponent = (
  tagName: string,
  opts: JsxElementOpts & { node: ts.Node }
) => {
  const className = classNameHash(opts.css);
  const compiledCss: string[] = stylis(`.${className}`, opts.css);

  return createFragmentNode(
    opts.node,
    createStyleNode(opts.node, className, compiledCss, opts),
    createJsxElement(tagName, className, opts)
  );
};

/**
 * Will create a jsx element based on the input jsx element `node`.
 *
 * Output:
 *
 * <React.Fragment>
 *   <Style>{[..]}</Style>
 *   <`node.openingJsxElement.tagName`>{`opts.children`}</`node.closingElement.tagName`>
 * </React.Fragment>
 */
export const createCompiledComponentFromNode = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  opts: JsxElementOpts & { propsToRemove?: string[] }
) => {
  const className = classNameHash(opts.css);
  const compiledCss: string[] = stylis(`.${className}`, opts.css);

  return createFragmentNode(
    node,
    createStyleNode(node, className, compiledCss, opts),
    cloneJsxElement(node, className, opts)
  );
};
