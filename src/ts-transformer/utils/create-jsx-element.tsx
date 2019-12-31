import * as ts from 'typescript';
import stylis from 'stylis';
import { nextClassName } from './identifiers';
import { getJsxNodeAttributes } from './ast-node';
import { CssVariableExpressions } from '../types';

interface JsxElementOpts {
  css: string;
  cssVariables: CssVariableExpressions[];
  originalNode: ts.Node;
  selector?: string;
  children?: ts.JsxChild;
}

export const createStyleFragment = ({
  selector = `.${nextClassName()}`,
  originalNode,
  ...opts
}: JsxElementOpts) => {
  const compiledCss = stylis(selector, opts.css);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(ts.createIdentifier('style'), [], ts.createJsxAttributes([])),
      originalNode
    ),
    // should this be text or an jsx expression?
    [ts.createJsxText(compiledCss)],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier('style')), originalNode)
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
  const className = nextClassName();
  const compiledCss = stylis(`.${className}`, opts.css);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(ts.createIdentifier('style'), [], ts.createJsxAttributes([])),
      originalNode
    ),
    // should this be text or an jsx expression?
    [ts.createJsxText(compiledCss)],
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(ts.createJsxClosingElement(ts.createIdentifier('style')), originalNode)
  );

  const elementNode = ts.createJsxElement(
    // We use setOriginalNode() here to work around createJsx not working without the original node.
    // See: https://github.com/microsoft/TypeScript/issues/35686
    ts.setOriginalNode(
      ts.createJsxOpeningElement(
        ts.createIdentifier(tagNode),
        [],
        ts.createJsxAttributes([
          ts.createJsxAttribute(
            ts.createIdentifier('className'),
            ts.createStringLiteral(className)
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
    // TODO: we could pass this into jsx opening element
    const elementNodeAttributes = getJsxNodeAttributes(elementNode);
    (elementNodeAttributes.properties as any).push(
      ts.createJsxAttribute(
        ts.createIdentifier('style'),
        ts.createJsxExpression(
          undefined,
          ts.createObjectLiteral(
            opts.cssVariables.map(variable => {
              return ts.createPropertyAssignment(
                ts.createStringLiteral(variable.name),
                variable.identifier
              );
            }),
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
