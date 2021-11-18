import generate from '@babel/generator';
import template from '@babel/template';
import type { NodePath, Visitor } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { transformCss } from '@compiled/css';
import { unique } from '@compiled/utils';
import isPropValid from '@emotion/is-prop-valid';

import { PROPS_IDENTIFIER_NAME } from '../constants';
import type { Metadata, Tag } from '../types';

import { pickFunctionBody } from './ast';
import { buildCssVariables } from './build-css-variables';
import { getItemCss } from './css-builders';
import { hoistSheet } from './hoist-sheet';
import { resolveIdentifierComingFromDestructuring } from './resolve-binding';
import { transformCssItems } from './transform-css-items';
import type { CSSOutput, CssItem, Sheet, CssSheet } from './types';

/**
 * Returns a tag string in the form of an identifier or string literal.
 *
 * A type of InBuiltComponent will return a string literal,
 * otherwise an identifier string will be returned.
 *
 * @param tag Made of name and type.
 */
const buildComponentTag = ({ name, type }: Tag) => {
  return type === 'InBuiltComponent' ? `"${name}"` : name;
};

/**
 * Traverses an arrow function and then finally return the arrow function body node.
 *
 * @param node Array function node
 * @param nestedVisitor Visitor callback function
 */
const traverseStyledArrowFunctionExpression = (
  node: t.ArrowFunctionExpression,
  nestedVisitor: Visitor
) => {
  traverse(node, nestedVisitor);

  return pickFunctionBody(node);
};

/**
 * Traverses a binary expression looking for any arrow functions,
 * calls back with each arrow function node into the passed in `nestedVisitor`,
 * and then finally replaces each found arrow function node with its body.
 *
 * @param node Binary expression node
 * @param nestedVisitor Visitor callback function
 */
const traverseStyledBinaryExpression = (node: t.BinaryExpression, nestedVisitor: Visitor) => {
  traverse(node, {
    noScope: true,
    ArrowFunctionExpression(path) {
      path.traverse(nestedVisitor);
      path.replaceWith(pickFunctionBody(path.node));
      path.stop();
    },
  });

  return node;
};

/**
 * Handles cases like:
 * 1. `propz.loading` in `border-color: \${(propz) => (propz.loading ? colors.N100 : colors.N200)};`
 * Outcome: It will replace `propz.loading` with `props.loading`.
 *
 * 2. `props.notValidProp` in `border-color: \${(props) => (props.notValidProp ? colors.N100 : colors.N200)};`
 * Outcome: It will move `notValidProp` under `propsToDestructure` and replaces `props.notValidProp` with `notValidProp`.
 *
 * @param path MemberExpression path
 */
const handleMemberExpressionInStyledInterpolation = (path: NodePath<t.MemberExpression>) => {
  const memberExpressionKey = path.node.object;
  const propsToDestructure: string[] = [];

  if (t.isIdentifier(memberExpressionKey)) {
    const traversedUpFunctionPath: NodePath<t.Node> | null = path.find((parentPath) =>
      parentPath.isFunction()
    );
    const memberExpressionKeyName = memberExpressionKey.name;

    const isMemberExpressionNameTheSameAsFunctionFirstParam: boolean | null =
      traversedUpFunctionPath &&
      t.isFunction(traversedUpFunctionPath.node) &&
      t.isIdentifier(traversedUpFunctionPath.node.params[0]) &&
      traversedUpFunctionPath.node.params[0].name === memberExpressionKeyName;

    if (isMemberExpressionNameTheSameAsFunctionFirstParam) {
      const memberExpressionValue = path.node.property;

      if (t.isIdentifier(memberExpressionValue)) {
        const memberExpressionValueName = memberExpressionValue.name;

        // if valid html attribute let it through - else destructure to prevent
        if (isPropValid(memberExpressionValueName)) {
          // Convert cases like propz.color to props.color
          if (memberExpressionKeyName !== PROPS_IDENTIFIER_NAME) {
            path.replaceWith(
              t.memberExpression(
                t.identifier(PROPS_IDENTIFIER_NAME),
                t.identifier(memberExpressionValueName)
              )
            );
          }
        } else {
          propsToDestructure.push(memberExpressionValueName);
          path.replaceWith(memberExpressionValue);
        }
      }
    }
  }

  return propsToDestructure;
};

/**
 * Handles cases like:
 * 1. `isLoading` in `background-color: \${({ isLoading }) => (isLoading ? colors.N20 : colors.N40)};`
 * Outcome: It will move `isLoading` under `propsToDestructure`.
 *
 * 2. `l` in `color: \${({ loading: l }) => (l ? colors.N50 : colors.N10)};`
 * Outcome: It will move `loading` under `propsToDestructure` and replaces `l` with `loading`.
 *
 * @param path Identifier path
 */
const handleDestructuringInStyledInterpolation = (path: NodePath<t.Identifier>) => {
  const propsToDestructure: string[] = [];

  // We are not interested in parent object property like `({ loading: load }) => load`.
  // Both `: load` and `=> load` are identifiers and function is parent for both.
  // We are not interested in modifying `: load`. We just need to modify `=> load` to `=> loading`.
  // If we don't skip, `=> load` will not be modified because we have modified `: load` earlier and
  // second identifier is nowhere to be found inside function params.
  if (path.parentPath && !t.isObjectProperty(path.parentPath.node)) {
    const traversedUpFunctionPath: NodePath<t.Node> | null = path.find((parentPath) =>
      parentPath.isFunction()
    );

    const firstFunctionParam =
      traversedUpFunctionPath &&
      t.isFunction(traversedUpFunctionPath.node) &&
      traversedUpFunctionPath.node.params[0];

    const resolvedDestructuringIdentifier = resolveIdentifierComingFromDestructuring({
      name: path.node.name,
      node: firstFunctionParam as t.Expression,
      resolveFor: 'value',
    });

    if (resolvedDestructuringIdentifier && t.isIdentifier(resolvedDestructuringIdentifier.key)) {
      const resolvedDestructuringIdentifierKey = resolvedDestructuringIdentifier.key;
      const resolvedDestructuringIdentifierKeyName = resolvedDestructuringIdentifierKey.name;

      propsToDestructure.push(resolvedDestructuringIdentifierKeyName);

      // We are only interested in cases when names are different otherwise this will go in infinite recursion.
      if (resolvedDestructuringIdentifierKeyName !== path.node.name) {
        path.replaceWith(t.identifier(resolvedDestructuringIdentifierKeyName));
      }
    }
  }

  return propsToDestructure;
};

export interface StyledTemplateOpts {
  /**
   * Class to be used for the CSS selector.
   */
  classNames: t.Expression[];

  /**
   * Tag for the Styled Component, for example "div" or user defined component.
   */
  tag: Tag;

  /**
   * CSS variables to be passed to the `style` prop.
   */
  variables: CSSOutput['variables'];

  /**
   * CSS sheets to be passed to the `CS` component.
   */
  sheets: Sheet[];
}

/**
 * Will return a generated AST for a Styled Component.
 *
 * @param opts {StyledTemplateOpts} Template options
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const styledTemplate = (opts: StyledTemplateOpts, meta: Metadata): t.Node => {
  const nonceAttribute = meta.state.opts.nonce ? `nonce={${meta.state.opts.nonce}}` : '';
  const propsToDestructure: string[] = [];

  const styleProp = opts.variables.length
    ? [
        t.spreadElement(t.identifier('style')),
        buildCssVariables(opts.variables, (node) => {
          const nestedArrowFunctionExpressionVisitor = {
            noScope: true,
            MemberExpression(path: NodePath<t.MemberExpression>) {
              const propsToDestructureFromMemberExpression =
                handleMemberExpressionInStyledInterpolation(path);

              propsToDestructure.push(...propsToDestructureFromMemberExpression);
            },
            Identifier(path: NodePath<t.Identifier>) {
              const propsToDestructureFromIdentifier =
                handleDestructuringInStyledInterpolation(path);

              propsToDestructure.push(...propsToDestructureFromIdentifier);
            },
          };

          if (t.isArrowFunctionExpression(node)) {
            return traverseStyledArrowFunctionExpression(
              node,
              nestedArrowFunctionExpressionVisitor
            );
          }

          if (t.isBinaryExpression(node)) {
            return traverseStyledBinaryExpression(node, nestedArrowFunctionExpressionVisitor);
          }

          return node;
        }),
      ]
    : t.identifier('style');

  let unconditionalClassNames = '',
    conditionalClassNames = '';

  opts.classNames.forEach((item) => {
    if (t.isStringLiteral(item)) {
      unconditionalClassNames += `${item.value} `;
    } else if (t.isLogicalExpression(item) || t.isConditionalExpression(item)) {
      conditionalClassNames += `${generate(item).code}, `;
    }
  });


  const classNames = `"${unconditionalClassNames.trim()}", ${conditionalClassNames}`;

  return template(
    `
  forwardRef(({
    as: C = ${buildComponentTag(opts.tag)},
    style,
    ${unique(propsToDestructure)
      .map((prop: string) => prop + ',')
      .join('')}
    ...${PROPS_IDENTIFIER_NAME}
  }, ref) => (
    <CC>
      <CS ${nonceAttribute}>{%%cssNode%%}</CS>
      <C
        {...${PROPS_IDENTIFIER_NAME}}
        style={%%styleProp%%}
        ref={ref}
        className={ax([${classNames} ${PROPS_IDENTIFIER_NAME}.className])}
      />
    </CC>
  ));
`,
    {
      plugins: ['jsx'],
    }
  )({
    styleProp,
    cssNode: t.arrayExpression(
      unique(opts.sheets).map((sheet) =>
        sheet.type === 'reference' ? t.identifier(sheet.reference) : hoistSheet(sheet, meta)
      )
    ),
  }) as t.Node;
};

/**
 * Returns a Styled Component AST.
 *
 * @param tag {Tag} Styled tag either an inbuilt or user define
 * @param cssOutput {CSSOutput} CSS and variables to place onto the component
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const buildStyledComponent = (tag: Tag, cssOutput: CSSOutput, meta: Metadata): t.Node => {
  const unconditionalCss: string[] = [];
  const nonUnconditionalCss: CssItem[] = [];

  cssOutput.css.forEach((item) => {
    if (item.type === 'unconditional') {
      unconditionalCss.push(getItemCss(item));
    } else {
      nonUnconditionalCss.push(item);
    }
  });

  // Rely on transformCss to remove duplicates and return only the last unconditional CSS for each property
  const uniqueUnconditionalCssOutput = transformCss(unconditionalCss.join(''));

  // Rely on transformItemCss to build logicalExpressions for logical CSS
  const nonUnconditionalCssOutput = transformCssItems(nonUnconditionalCss);

  const sheets = [
    ...uniqueUnconditionalCssOutput.sheets.map<CssSheet>((sheet) => ({
      type: 'css',
      css: sheet,
    })),
    ...nonUnconditionalCssOutput.sheets,
  ];

  const classNames = [
    ...[t.stringLiteral(uniqueUnconditionalCssOutput.classNames.join(' '))],
    ...nonUnconditionalCssOutput.classNames,
  ];

  return styledTemplate(
    {
      classNames,
      tag,
      sheets,
      variables: cssOutput.variables,
    },
    meta
  );
};
