import type { NodePath } from '@babel/core';
import * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCss } from '../utils/css-builders';
import { transformCssItems } from '../utils/transform-css-items';

// The messages are exported for testing.
export enum ErrorMessages {
  NUMBER_OF_ARGUMENT = 'xcss function can only receive one argument.',
  ARGUMENT_TYPE = 'xcss function can only receive an object.',
  DEFINE_XCSS = 'XCSS must be declared at the top-most scope of the module.',
  STATIC_CSS = 'The CSS object must be statically defined.',
}

const createErrorMessage = (message: string): string => {
  return `
${message} 
To correctly implement a XCSS, follow the syntax below:

\`\`\`
import { xcss } from '@compiled/react';
const styleOverrides = xcss({
    color: "red"
});
<Component xcss={styleOverrides} />
\`\`\`
    `;
};

/**
 * Takes `xcss` function expression and then transforms it to class names and sheet.
 *
 * For example:
 * ```
 * const styleOverrides = xcss({
 *  color: "red"
 * });
 * ```
 * gets transformed to
 * ```
 * const styleOverrides = "_syaz5scu";
 * ```
 *
 * @param path {NodePath} The path to be evaluated.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const visitXCssPath = (
  path: NodePath<t.CallExpression> | NodePath<t.TaggedTemplateExpression>,
  meta: Metadata
): void => {
  // We don't support tagged template expressions.
  if (t.isTaggedTemplateExpression(path.node)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DEFINE_XCSS),
      path.node,
      meta.parentPath
    );
  }

  // We need to ensure XCSS is declared at the top-most scope of the module.
  if (!t.isVariableDeclarator(path.parent) || !t.isIdentifier(path.parent.id)) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.DEFINE_XCSS),
      path.node,
      meta.parentPath
    );
  }

  // We need to ensure xcss receives only one argument.
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

  const { css, variables } = buildCss(path.node.arguments[0], meta);

  if (variables.length) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.STATIC_CSS),
      path.node,
      meta.parentPath
    );
  }

  const { sheets, classNames } = transformCssItems(css, meta);

  const parsedClassNames = classNames.reduce((accumulator, currentValue) => {
    // className should be a string literal unless a runtime variable is used.
    if (!t.isStringLiteral(currentValue)) {
      throw new Error(ErrorMessages.STATIC_CSS);
    }
    return accumulator + currentValue.value;
  }, '');

  path.replaceWith(t.stringLiteral(parsedClassNames));

  // We store sheets in the meta state so that we can use it later to generate Compiled component.
  meta.state.xcss[path.parent.id.name] = sheets;
};
