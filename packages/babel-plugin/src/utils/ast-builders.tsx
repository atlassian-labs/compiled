import template from '@babel/template';
import * as t from '@babel/types';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import { transformCss } from '@compiled/ts-transform-css-in-js/dist/utils/css-transform';

interface BaseOpts {
  css: string;
}

interface StyledOpts extends BaseOpts {
  tagName: string;
}

interface CompiledOpts extends BaseOpts {
  node: t.JSXElement;
}

const styledTemplate = template(
  `
  React.forwardRef(({
    as: C = %%tag%%,
    ...props
  }, ref) => (
    <CC>
      <CS hash={%%hash%%}>{%%css%%}</CS>
      <C {...props} ref={ref} className={%%className%% + (props.className ? " " + props.className : "")} />
    </CC>
  ));
`,
  {
    plugins: ['jsx'],
  }
);

const compiledTemplate = template(
  `
<CC>
  <CS hash={%%hash%%}>{%%css%%}</CS>
  {%%jsxNode%%}
</CC>
`,
  {
    plugins: ['jsx'],
  }
);

export const joinExpressions = (left: any, right: any): t.BinaryExpression => {
  return t.binaryExpression('+', left, t.binaryExpression('+', t.stringLiteral(' '), right));
};

export const buildStyledComponent = (opts: StyledOpts) => {
  const cssHash = hash(opts.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.css);

  return styledTemplate({
    className: t.stringLiteral(className),
    hash: t.stringLiteral(cssHash),
    tag: t.stringLiteral(opts.tagName),
    css: t.arrayExpression(cssRules.map((rule) => t.stringLiteral(rule))),
  }) as t.Node;
};

export const importSpecifier = (name: string, localName?: string) => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

export const buildCompiledComponent = (opts: CompiledOpts) => {
  const cssHash = hash(opts.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.css);

  const classNameProp = opts.node.openingElement.attributes.find((prop): prop is t.JSXAttribute => {
    return t.isJSXAttribute(prop) && prop.name.name === 'className';
  });

  if (classNameProp && classNameProp.value) {
    const classNameExpression = t.isJSXExpressionContainer(classNameProp.value)
      ? classNameProp.value.expression
      : classNameProp.value;

    classNameProp.value = t.jsxExpressionContainer(
      joinExpressions(t.stringLiteral(className), classNameExpression)
    );
  } else {
    opts.node.openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(className))
    );
  }

  return compiledTemplate({
    jsxNode: opts.node,
    hash: t.stringLiteral(cssHash),
    css: t.arrayExpression(cssRules.map((rule) => t.stringLiteral(rule))),
  }) as t.Node;
};
