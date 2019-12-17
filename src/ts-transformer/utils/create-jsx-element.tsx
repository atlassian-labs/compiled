import * as ts from 'typescript';
import stylis from 'stylis';
import { nextClassName } from './identifiers';
import { getJsxNodeAttributes } from './ast-node';
import { CssVariableExpressions } from '../types';

interface JsxElementOpts {
  css: string;
  cssVariables: CssVariableExpressions[];
  children?: ts.JsxElement | ts.JsxExpression;
}

export const createJsxElement = (tagNode: string, opts: JsxElementOpts) => {
  const className = nextClassName();
  const compiledCss = stylis(`.${className}`, opts.css);

  // Create the style element that will precede the node that had the css prop.
  const styleNode = ts.createJsxElement(
    ts.createJsxOpeningElement(ts.createIdentifier('style'), [], ts.createJsxAttributes([])),
    // should this be text or an jsx expression?
    [ts.createJsxText(compiledCss)],
    ts.createJsxClosingElement(ts.createIdentifier('style'))
  );

  const elementNode = ts.createJsxElement(
    // todo: we need to set types and shit depending on props used
    ts.createJsxOpeningElement(
      ts.createIdentifier(tagNode),
      [],
      ts.createJsxAttributes([
        ts.createJsxAttribute(ts.createIdentifier('className'), ts.createStringLiteral(className)),
      ])
    ),
    opts.children ? [opts.children] : [],
    ts.createJsxClosingElement(ts.createIdentifier(tagNode))
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
                variable.expression
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
    ts.createJsxOpeningFragment(),
    [
      // important that the style goes before the node
      styleNode,
      elementNode,
    ],
    ts.createJsxJsxClosingFragment()
  );

  return newFragmentParent;
};
