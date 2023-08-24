import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCss } from '../utils/css-builders';
import { transformCssItems } from '../utils/transform-css-items';

// The messages are exported for testing.
export enum ErrorMessages {
  NO_TAGGED_TEMPLATE = 'cssMap function cannot be used as a tagged template expression.',
  NUMBER_OF_ARGUMENT = 'cssMap function can only receive one argument.',
  ARGUMENT_TYPE = 'cssMap function can only receive an object.',
  DEFINE_MAP = 'CSS Map must be declared at the top-most scope of the module.',
  NO_SPREAD_ELEMENT = 'Spread element is not supported in CSS Map.',
  NO_OBJECT_METHOD = 'Object method is not supported in CSS Map.',
  STATIC_VARIANT_OBJECT = 'The variant object must be statically defined.',
}

const createErrorMessage = (message: string): string => {
  return `
${message} 
To correctly implement a CSS Map, follow the syntax below:

\`\`\`
import { css, cssMap } from '@compiled/react';
const borderStyleMap = cssMap({
    none: { borderStyle: 'none' },
    solid: { borderStyle: 'solid' },
});
const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
\`\`\`
    `;
};

/**
 * Takes `cssMap` function expression and then transforms it to a record of class names and sheets.
 *
 * For example:
 * ```
 * const styles = cssMap({
 *    none: { color: 'red' },
 *    solid: { color: 'green' },
 * });
 * ```
 * gets transformed to
 * ```
 * const styles = {
 *    danger: "_syaz5scu",
 *    success: "_syazbf54",
 * };
 * ```
 *
 * @param path {NodePath} The path to be evaluated.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const visitCssMapPath = (
  path: NodePath<t.CallExpression> | NodePath<t.TaggedTemplateExpression>,
  meta: Metadata
): void => {
  // We don't support tagged template expressions.
  if (t.isTaggedTemplateExpression(path.node)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DEFINE_MAP),
      path.node,
      meta.parentPath
    );
  }

  // We need to ensure CSS Map is declared at the top-most scope of the module.
  if (!t.isVariableDeclarator(path.parent) || !t.isIdentifier(path.parent.id)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DEFINE_MAP),
      path.node,
      meta.parentPath
    );
  }

  // We need to ensure cssMap receives only one argument.
  if (path.node.arguments.length !== 1) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.NUMBER_OF_ARGUMENT),
      path.node,
      meta.parentPath
    );
  }

  // We need to ensure the argument is an objectExpression.
  if (!t.isObjectExpression(path.node.arguments[0])) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.ARGUMENT_TYPE),
      path.node,
      meta.parentPath
    );
  }

  const totalSheets: string[] = [];
  path.replaceWith(
    t.objectExpression(
      path.node.arguments[0].properties.map((property) => {
        if (t.isSpreadElement(property)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.NO_SPREAD_ELEMENT),
            property.argument,
            meta.parentPath
          );
        }

        if (t.isObjectMethod(property)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.NO_OBJECT_METHOD),
            property.key,
            meta.parentPath
          );
        }

        if (!t.isObjectExpression(property.value)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        const { css, variables } = buildCss(property.value, meta);

        if (variables.length) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        const { sheets, classNames } = transformCssItems(css, meta);
        totalSheets.push(...sheets);

        if (classNames.length !== 1) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property,
            meta.parentPath
          );
        }

        return t.objectProperty(property.key, classNames[0]);
      })
    )
  );

  // We store sheets in the meta state so that we can use it later to generate Compiled component.
  meta.state.cssMap[path.parent.id.name] = totalSheets;
};
