import * as ts from 'typescript';
import stylis from 'stylis';
import { nextClassName } from './identifiers';
import { getJsxNodeAttributes } from './ast-node';
import { CssVariableExpressions } from '../types';

interface JsxElementOpts {
  css: string;
  cssVariables: CssVariableExpressions[];
  originalNode: ts.Node;
  skipClassName?: boolean;
  styleFactory?: (
    props: ts.PropertyAssignment[]
  ) => (ts.PropertyAssignment | ts.SpreadAssignment)[];
  classNameFactory?: (node: ts.StringLiteral) => ts.StringLiteral | ts.JsxExpression;
  jsxAttributes?: (ts.JsxAttribute | ts.JsxSpreadAttribute)[];
  children?: ts.JsxChild;
}

const STYLE_ELEMENT = 'Style';
const STYLE_ATTRIBUTE_NAME = 'style';

/**
 * Will return something like this:
 * <>
 *  <style></style>
 *  {opts.children}
 * </>
 */
export const createStyleFragment = ({ originalNode, ...opts }: JsxElementOpts) => {
  const className = nextClassName(opts.css);
  const compiledCss = stylis(opts.skipClassName ? `.${className}` : '', opts.css);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        ts.createIdentifier(STYLE_ELEMENT),
        [],
        ts.createJsxAttributes([])
      ),
      originalNode
    ),
    // should this be text or an jsx expression?
    [ts.createJsxText(compiledCss)],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier(STYLE_ELEMENT)), originalNode)
  );

  const children: ts.JsxChild[] = [
    // important that the style goes before the node
    styleNode,
  ];

  // Create a new fragment that will wrap both the style and the node we found initially.
  const newFragmentParent = ts.createJsxFragment(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxOpeningFragment(), originalNode),
    children.concat(opts.children ? opts.children : []),
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxJsxClosingFragment(), originalNode)
  );

  return newFragmentParent;
};

export const createJsxElement = (tagNode: string, opts: JsxElementOpts, originalNode: ts.Node) => {
  const className = nextClassName(opts.css);
  const compiledCss = stylis(`.${className}`, opts.css);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        ts.createIdentifier(STYLE_ELEMENT),
        [],
        ts.createJsxAttributes([])
      ),
      originalNode
    ),
    // should this be text or an jsx expression?
    [ts.createJsxText(compiledCss)],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier(STYLE_ELEMENT)), originalNode)
  );

  const elementNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        ts.createIdentifier(tagNode),
        [],
        ts.createJsxAttributes([
          ...(opts.jsxAttributes || []),
          // className should always be last
          ts.createJsxAttribute(
            ts.createIdentifier('className'),
            opts.classNameFactory
              ? opts.classNameFactory(ts.createStringLiteral(className))
              : ts.createStringLiteral(className)
          ),
        ])
      ),
      originalNode
    ),
    opts.children ? [opts.children] : [],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier(tagNode)), originalNode)
  );

  if (opts.cssVariables.length) {
    const styleProps = opts.cssVariables.map(variable => {
      return ts.createPropertyAssignment(
        ts.createStringLiteral(variable.name),
        variable.expression
      );
    });

    // TODO: we could pass this into jsx opening element
    const elementNodeAttributes = getJsxNodeAttributes(elementNode);
    (elementNodeAttributes.properties as any).push(
      ts.createJsxAttribute(
        ts.createIdentifier(STYLE_ATTRIBUTE_NAME),
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

  // Create a new fragment that will wrap both the style and the node we found initially.
  const newFragmentParent = ts.createJsxFragment(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxOpeningFragment(), originalNode),
    [
      // important that the style goes before the node
      styleNode,
      elementNode,
    ],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxJsxClosingFragment(), originalNode)
  );

  return newFragmentParent;
};
