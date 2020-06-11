import template from '@babel/template';
import * as t from '@babel/types';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import { transformCss } from '@compiled/ts-transform-css-in-js/dist/utils/css-transform';

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
  <C {...props} ref={ref} className={%%className%% + (props.className ? " " + props.className : "")} />
</CC>
`,
  {
    plugins: ['jsx'],
  }
);

interface BaseOpts {
  css: string;
}

interface StyledOpts extends BaseOpts {
  tagName: string;
}

export const buildStyledComponent = (opts: StyledOpts) => {
  const cssHash = hash(opts.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.css);

  return styledTemplate({
    className,
    hash: t.stringLiteral(cssHash),
    tag: t.stringLiteral(opts.tagName),
    css: t.arrayExpression(cssRules.map((rule) => t.stringLiteral(rule))),
  }) as t.Node;
};

export const importSpecifier = (name: string, localName?: string) => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

export const buildCompiledComponent = (opts: BaseOpts) => {
  const cssHash = hash(opts.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.css);

  return compiledTemplate({
    className,
    hash: t.stringLiteral(cssHash),
    css: t.arrayExpression(cssRules.map((rule) => t.stringLiteral(rule))),
  }) as t.Node;
};
