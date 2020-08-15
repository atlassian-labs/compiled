import template from '@babel/template';
import * as t from '@babel/types';
import traverse, { Scope, NodePath } from '@babel/traverse';
import { hash, unique } from '@compiled/utils';
import { transformCss } from '@compiled/css';
import isPropValid from '@emotion/is-prop-valid';

import { CSSOutput } from './css-builders';
import { PluginOptions } from '../types';

interface BaseOpts extends PluginOptions {
  cssOutput: CSSOutput;
}

interface StyledOpts extends BaseOpts {
  tagName: string;
  parentPath: NodePath;
  scope: Scope;
}

interface CompiledOpts extends BaseOpts {
  node: t.JSXElement;
}

const buildCssVariablesProp = (
  variables: CSSOutput['variables'],
  transform = (expression: t.Expression) => expression
): (t.ObjectProperty | t.SpreadElement)[] => {
  return unique(variables, (item) => item.name).map((variable) => {
    return t.objectProperty(t.stringLiteral(variable.name), transform(variable.expression));
  });
};

const styledStyleProp = (
  variables: CSSOutput['variables'],
  transform?: (expression: t.Expression) => any
) => {
  const props: (t.ObjectProperty | t.SpreadElement)[] = [t.spreadElement(t.identifier('style'))];
  return t.objectExpression(props.concat(buildCssVariablesProp(variables, transform)));
};

const styledTemplate = (opts: {
  nonce?: string;
  className: string;
  hash: string;
  tag: string;
  css: string[];
  variables: CSSOutput['variables'];
  parentPath: NodePath;
  scope: Scope;
}) => {
  const nonceAttribute = opts.nonce ? `nonce={${opts.nonce}}` : '';
  const propsToDestructure: string[] = [];
  const styleProp = opts.variables.length
    ? styledStyleProp(opts.variables, (node) => {
        if (t.isArrowFunctionExpression(node)) {
          traverse(
            node,
            {
              MemberExpression(path) {
                if (t.isIdentifier(path.node.object) && path.node.object.name === 'props') {
                  const propertyAccessName = path.node.property as t.Identifier;
                  if (isPropValid(propertyAccessName.name)) {
                    return;
                  }

                  if (!propsToDestructure.includes(propertyAccessName.name)) {
                    propsToDestructure.push(propertyAccessName.name);
                  }
                  path.replaceWith(propertyAccessName);
                }
              },
            },
            opts.scope,
            undefined,
            opts.parentPath
          );

          return node.body;
        }

        return node;
      })
    : t.identifier('style');

  return template(
    `
  React.forwardRef(({
    as: C = "${opts.tag}",
    style,
    ${propsToDestructure.map((prop) => prop + ',').join('')}
    ...props
  }, ref) => (
    <CC>
      <CS ${nonceAttribute} hash="${opts.hash}">{%%cssNode%%}</CS>
      <C {...props} style={%%styleProp%%} ref={ref} className={"${
        opts.className
      }" + (props.className ? " " + props.className : "")} />
    </CC>
  ));
`,
    {
      plugins: ['jsx'],
    }
  )({
    styleProp,
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
    ...opts,
    className,
    hash: cssHash,
    tag: opts.tagName,
    css: cssRules,
    variables: opts.cssOutput.variables,
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
