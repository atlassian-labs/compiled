import template from '@babel/template';
import * as t from '@babel/types';
import { hash } from '@compiled/ts-transform-css-in-js/dist/utils/hash';
import { transformCss } from '@compiled/ts-transform-css-in-js/dist/utils/css-transform';
import { unique } from '@compiled/ts-transform-css-in-js/dist/utils/array';
import { CSSOutput } from './css-builders';
import { PluginOptions } from '../types';

interface BaseOpts extends PluginOptions {
  cssOutput: CSSOutput;
}

interface StyledOpts extends BaseOpts {
  tagName: string;
}

interface CompiledOpts extends BaseOpts {
  node: t.JSXElement;
}

const styledTemplate = (opts: {
  nonce?: string;
  className: string;
  hash: string;
  tag: string;
  css: string[];
}) => {
  const nonceAttribute = opts.nonce ? `nonce={${opts.nonce}}` : '';

  return template(
    `
  React.forwardRef(({
    as: C = "${opts.tag}",
    ...props
  }, ref) => (
    <CC>
      <CS ${nonceAttribute} hash="${opts.hash}">{%%cssNode%%}</CS>
      <C {...props} ref={ref} className={"${opts.className}" + (props.className ? " " + props.className : "")} />
    </CC>
  ));
`,
    {
      plugins: ['jsx'],
    }
  )({
    cssNode: t.arrayExpression(opts.css.map((style) => t.stringLiteral(style))),
  });
};

const compiledTemplate = (opts: {
  nonce?: string;
  hash: string;
  css: string[];
  jsxNode: t.JSXElement;
}) => {
  const nonceAttribute = opts.nonce ? `nonce={${opts.nonce}}` : '';

  return template(
    `
  <CC>
    <CS ${nonceAttribute} hash="${opts.hash}">{%%cssNode%%}</CS>
    {%%jsxNode%%}
  </CC>
  `,
    {
      plugins: ['jsx'],
    }
  )({
    jsxNode: opts.jsxNode,
    cssNode: t.arrayExpression(opts.css.map((style) => t.stringLiteral(style))),
  });
};

export const joinExpressions = (
  left: any,
  right: any,
  spacer: any = t.stringLiteral(' ')
): t.BinaryExpression => {
  return t.binaryExpression('+', left, spacer ? t.binaryExpression('+', spacer, right) : right);
};

export const conditionallyJoinExpressions = (left: any, right: any): t.BinaryExpression => {
  return t.binaryExpression(
    '+',
    left,
    t.conditionalExpression(
      right,
      t.binaryExpression('+', t.stringLiteral(' '), right),
      t.stringLiteral('')
    )
  );
};

export const buildStyledComponent = (opts: StyledOpts) => {
  const cssHash = hash(opts.cssOutput.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.cssOutput.css);

  return styledTemplate({
    className,
    hash: cssHash,
    tag: opts.tagName,
    css: cssRules,
  }) as t.Node;
};

export const importSpecifier = (name: string, localName?: string) => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

export const buildCompiledComponent = (opts: CompiledOpts) => {
  const cssHash = hash(opts.cssOutput.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.cssOutput.css);
  const classNameProp = opts.node.openingElement.attributes.find((prop): prop is t.JSXAttribute => {
    return t.isJSXAttribute(prop) && prop.name.name === 'className';
  });

  if (classNameProp && classNameProp.value) {
    const classNameExpression = t.isJSXExpressionContainer(classNameProp.value)
      ? classNameProp.value.expression
      : classNameProp.value;

    const newClassNameValue = t.isStringLiteral(classNameExpression)
      ? joinExpressions(t.stringLiteral(className), classNameExpression)
      : conditionallyJoinExpressions(t.stringLiteral(className), classNameExpression);

    classNameProp.value = t.jsxExpressionContainer(newClassNameValue);
  } else {
    opts.node.openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(className))
    );
  }

  if (opts.cssOutput.variables.length) {
    let stylePropIndex = -1;
    const styleProp = opts.node.openingElement.attributes.find(
      (prop, index): prop is t.JSXAttribute => {
        if (t.isJSXAttribute(prop) && prop.name.name === 'style') {
          stylePropIndex = index;
          return true;
        }

        return false;
      }
    );

    const dynamicStyleProperties: (t.SpreadElement | t.ObjectProperty)[] = unique(
      opts.cssOutput.variables,
      (item) => item.name
    ).map((variable) => {
      return t.objectProperty(t.stringLiteral(variable.name), variable.expression);
    });

    if (styleProp) {
      // Remove the pre-existing style prop - we're going to redefine it soon.
      opts.node.openingElement.attributes.splice(stylePropIndex, 1);

      if (
        styleProp.value &&
        t.isJSXExpressionContainer(styleProp.value) &&
        !t.isJSXEmptyExpression(styleProp.value.expression)
      ) {
        // If it's not an object we just spread the expression into the object
        if (!t.isObjectExpression(styleProp.value.expression)) {
          dynamicStyleProperties.splice(0, 0, t.spreadElement(styleProp.value.expression));
        } else {
          // Else it's an object! So we want to place each property into the object
          styleProp.value.expression.properties.forEach((prop, index) => {
            if (t.isObjectMethod(prop)) {
              return;
            }

            // ... in the order they were defined! (So we're using index here to do just that).
            dynamicStyleProperties.splice(index, 0, prop);
          });
        }
      }
    }

    opts.node.openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('style'),
        t.jsxExpressionContainer(t.objectExpression(dynamicStyleProperties))
      )
    );
  }

  return compiledTemplate({
    jsxNode: opts.node,
    hash: cssHash,
    css: cssRules,
    nonce: opts.nonce,
  }) as t.Node;
};
