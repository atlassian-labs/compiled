import template from '@babel/template';
import * as t from '@babel/types';
import traverse, { Scope, NodePath, Visitor } from '@babel/traverse';
import { hash, unique } from '@compiled/utils';
import { transformCss } from '@compiled/css';
import isPropValid from '@emotion/is-prop-valid';

import { PluginOptions, Tag } from '../types';

import { CSSOutput } from './css-builders';
import { pickArrowFunctionExpressionBody } from './ast';

interface BaseOpts extends PluginOptions {
  /**
   * CSS data that will be integrated into the output AST.
   */
  cssOutput: CSSOutput;
}

interface StyledOpts extends BaseOpts {
  /**
   * Tag of the Styled Component,
   * for example `"div"` or user defined component.
   */
  tag: Tag;

  /**
   * Babel path used for traversing inner nodes.
   */
  parentPath: NodePath;

  /**
   * Babel scope used for traversing inner nodes.
   */
  scope: Scope;
}

interface CompiledOpts extends BaseOpts {
  node: t.JSXElement;
}

/**
 * Will build up the CSS variables prop to be placed as inline styles.
 *
 * @param variables CSS variables that will be placed in the AST
 * @param transform Transform function that can be used to change the CSS variable expression
 */
const buildCssVariablesProp = (
  variables: CSSOutput['variables'],
  transform = (expression: t.Expression) => expression
): (t.ObjectProperty | t.SpreadElement)[] => {
  return unique(
    // Make sure all defined CSS variables are unique
    variables,
    // We consider their uniqueness based on their name
    (item) => item.name
  ).map((variable) => {
    // Map them into object properties.
    return t.objectProperty(
      t.stringLiteral(variable.name),
      // Allow callers to transform the expression if needed,
      // for example the styled API strips away the arrow function.
      transform(variable.expression)
    );
  });
};

/**
 * Builds up the inline style prop value for a Styled Component.
 *
 * @param variables CSS variables that will be placed in the AST
 * @param transform Transform function that can be used to change the CSS variable expression
 */
const styledStyleProp = (
  variables: CSSOutput['variables'],
  transform?: (expression: t.Expression) => any
) => {
  const props: (t.ObjectProperty | t.SpreadElement)[] = [t.spreadElement(t.identifier('style'))];
  return t.objectExpression(props.concat(buildCssVariablesProp(variables, transform)));
};

const buildComponentTag = ({ name, type }: Tag) =>
  type === 'InBuiltComponent' ? `"${name}"` : name;

const traverseStyledArrowFunctionExpression = (
  node: t.ArrowFunctionExpression,
  nestedVisitor: Visitor
) => {
  traverse(node, nestedVisitor);

  return pickArrowFunctionExpressionBody(node);
};

const traverseStyledBinaryExpression = (node: t.BinaryExpression, nestedVisitor: Visitor) => {
  traverse(node, {
    noScope: true,
    ArrowFunctionExpression(path) {
      path.traverse(nestedVisitor);

      path.replaceWith(pickArrowFunctionExpressionBody(path.node));

      path.stop();
    },
  });

  return node;
};

/**
 * Will return a generated AST for a Styled Component.
 *
 * @param opts Template options.
 */
const styledTemplate = (opts: {
  /**
   * Adds a nonce onto the `CS` component.
   */
  nonce?: string;

  /**
   * Class to be used for the CSS selector.
   */
  className: string;

  /**
   * Hash that will be passed to the `CS` component.
   * This determines if the styles have been moved to the head on the client.
   */
  hash: string;

  /**
   * Tag for the Styled Component, for example "div" or user defined component.
   */
  tag: Tag;

  /**
   * CSS blocks to be passed to the `CS` component.
   */
  css: string[];

  /**
   * CSS variables to be passed to the `style` prop.
   */
  variables: CSSOutput['variables'];

  /**
   * Babel path used for traversing inner nodes.
   */
  parentPath: NodePath;

  /**
   * Babel scope used for traversing inner nodes.
   */
  scope: Scope;
}) => {
  const nonceAttribute = opts.nonce ? `nonce={${opts.nonce}}` : '';
  const propsToDestructure: string[] = [];
  const styleProp = opts.variables.length
    ? styledStyleProp(opts.variables, (node) => {
        const nestedArrowFunctionExpressionVisitor = {
          noScope: true,
          MemberExpression(path: NodePath<t.MemberExpression>) {
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
        };

        if (t.isArrowFunctionExpression(node)) {
          return traverseStyledArrowFunctionExpression(node, nestedArrowFunctionExpressionVisitor);
        }

        if (t.isBinaryExpression(node)) {
          return traverseStyledBinaryExpression(node, nestedArrowFunctionExpressionVisitor);
        }

        return node;
      })
    : t.identifier('style');

  return template(
    `
  React.forwardRef(({
    as: C = ${buildComponentTag(opts.tag)},
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

/**
 * Will return a generated AST for a Compiled Component.
 * This is primarily used for CSS prop and ClassNames apis.
 *
 * @param opts Template options.
 */
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

/**
 * Will join two expressions together,
 * Looks like `left + ' ' + right`.
 *
 * @param left Any node on the left
 * @param right Any node on the right
 * @param spacer Optional spacer node to place between the left and right node. Defaults to a space string.
 */
export const joinExpressions = (
  left: any,
  right: any,
  spacer: any = t.stringLiteral(' ')
): t.BinaryExpression => {
  return t.binaryExpression('+', left, spacer ? t.binaryExpression('+', spacer, right) : right);
};

/**
 * Will conditionally join two expressions together depending on the right expression.
 * Looks like: `left + right ? ' ' + right : ''`
 */
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

/**
 * Returns a Styled Component AST.
 *
 * @param opts Template options.
 */
export const buildStyledComponent = (opts: StyledOpts) => {
  const cssHash = hash(opts.cssOutput.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.cssOutput.css);

  return styledTemplate({
    ...opts,
    className,
    hash: cssHash,
    tag: opts.tag,
    css: cssRules,
    variables: opts.cssOutput.variables,
  }) as t.Node;
};

/**
 * Wrapper to make defining import specifiers easier.
 * If `localName` is defined it will rename the import to it,
 * e.g: `name as localName`.
 *
 * @param name import name
 * @param localName local name
 */
export const importSpecifier = (name: string, localName?: string) => {
  return t.importSpecifier(t.identifier(name), t.identifier(localName || name));
};

/**
 * Returns a Compiled Component AST.
 *
 * @param opts Template options.
 */
export const buildCompiledComponent = (opts: CompiledOpts) => {
  const cssHash = hash(opts.cssOutput.css);
  const className = `cc-${cssHash}`;
  const cssRules = transformCss(`.${className}`, opts.cssOutput.css);
  const classNameProp = opts.node.openingElement.attributes.find((prop): prop is t.JSXAttribute => {
    return t.isJSXAttribute(prop) && prop.name.name === 'className';
  });

  if (classNameProp && classNameProp.value) {
    // If there is a class name prop statically defined we want to concatenate it with
    // the class name we're going to put on it.
    const classNameExpression = t.isJSXExpressionContainer(classNameProp.value)
      ? classNameProp.value.expression
      : classNameProp.value;

    const newClassNameValue = t.isStringLiteral(classNameExpression)
      ? joinExpressions(t.stringLiteral(className), classNameExpression)
      : conditionallyJoinExpressions(t.stringLiteral(className), classNameExpression);

    classNameProp.value = t.jsxExpressionContainer(newClassNameValue);
  } else {
    // No class name - just push our own one.
    opts.node.openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier('className'), t.stringLiteral(className))
    );
  }

  if (opts.cssOutput.variables.length) {
    // If there is dynamic CSS in use we have work to do.
    let stylePropIndex = -1;
    // Find the style prop on the opening JSX element.
    const styleProp = opts.node.openingElement.attributes.find(
      (prop, index): prop is t.JSXAttribute => {
        if (t.isJSXAttribute(prop) && prop.name.name === 'style') {
          stylePropIndex = index;
          return true;
        }

        return false;
      }
    );

    const dynamicStyleProperties = buildCssVariablesProp(opts.cssOutput.variables);

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

            // We want to keep the order that they were defined in.
            // So we're using index here to do just that.
            dynamicStyleProperties.splice(index, 0, prop);
          });
        }
      }
    }

    // Finally add the new style prop back to the opening JSX element.
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
