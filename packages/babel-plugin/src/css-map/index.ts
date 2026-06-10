import type { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { NON_ATOMIC_CLASS_PREFIX } from '@compiled/css';
import { hash } from '@compiled/utils';

import type { Metadata } from '../types';
import { buildCodeFrameError } from '../utils/ast';
import { buildCss } from '../utils/css-builders';
import { ErrorMessages, createErrorMessage, errorIfNotValidObjectProperty } from '../utils/css-map';
import { transformCssItems } from '../utils/transform-css-items';

import { mergeExtendedSelectorsIntoProperties } from './process-selectors';

type CssMapOptions = {
  atomic?: boolean;
};

/**
 * @experimental Options for cssMap are not part of the public API and may change without notice.
 * The `atomic` option is intentionally omitted from the TypeScript type signature of cssMap.
 * Internal consumers can opt in using `@ts-ignore`, it's highly risky.
 *
 * When `atomic: false`, each variant is compiled to a single non-atomic CSS class
 * (no `_` prefix) instead of one atomic class per declaration. This dramatically
 * reduces the number of classes applied to a DOM element when a cssMap has many
 * properties — at the cost of losing atomic deduplication semantics for that map.
 */
const KNOWN_OPTIONS = ['atomic'];

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

  // We need to ensure cssMap receives either one or two arguments.
  if (path.node.arguments.length !== 1 && path.node.arguments.length !== 2) {
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

  if (path.node.arguments[1] && !t.isObjectExpression(path.node.arguments[1])) {
    throw buildCodeFrameError(
      createErrorMessage(ErrorMessages.OPTS_ARGUMENT_TYPE),
      path.node,
      meta.parentPath
    );
  }

  const optionsNode = path.node.arguments[1] as t.ObjectExpression | undefined;
  const options: CssMapOptions = {};

  if (optionsNode) {
    optionsNode.properties.forEach((prop) => {
      if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
        throw buildCodeFrameError(createErrorMessage(ErrorMessages.OPTS_PROPERTY_TYPE), prop, path);
      }

      const optionName = prop.key.name;
      if (!KNOWN_OPTIONS.includes(optionName)) {
        throw buildCodeFrameError(
          createErrorMessage(ErrorMessages.OPTS_PROPERTY_KNOWN_NAME),
          prop.key,
          path
        );
      }

      if (optionName === 'atomic') {
        // `atomic` must be a boolean literal
        if (!t.isBooleanLiteral(prop.value)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.OPTS_PROPERTY_VALUE_TYPE),
            prop.value,
            path
          );
        }
        options.atomic = prop.value.value;
        return;
      }

      // Fallback: unknown option with wrong value type
      throw buildCodeFrameError(
        createErrorMessage(ErrorMessages.OPTS_PROPERTY_KNOWN_NAME),
        prop.key,
        path
      );
    });
  }

  const totalSheets: string[] = [];
  path.replaceWith(
    t.objectExpression(
      path.node.arguments[0].properties.map((property) => {
        errorIfNotValidObjectProperty(property, meta);

        if (!t.isObjectExpression(property.value)) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        const processedPropertyValue = mergeExtendedSelectorsIntoProperties(property.value, meta);
        const { css, variables } = buildCss(processedPropertyValue, meta);

        if (variables.length) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property.value,
            meta.parentPath
          );
        }

        // Pre-compute the non-atomic class name from filename + variantKey to avoid
        // hashing the full CSS content string for potentially large cssMap variants.
        const variantKey = t.isIdentifier(property.key)
          ? property.key.name
          : t.isStringLiteral(property.key)
          ? property.key.value
          : undefined;
        const nonAtomicClassName =
          options.atomic === false && variantKey !== undefined
            ? `${NON_ATOMIC_CLASS_PREFIX}${hash(`${meta.state.filename ?? ''}:${variantKey}`)}`
            : undefined;

        const { sheets, classNames } = transformCssItems(css, meta, {
          ...options,
          nonAtomicClassName,
        });
        totalSheets.push(...sheets);

        if (classNames.length > 1) {
          throw buildCodeFrameError(
            createErrorMessage(ErrorMessages.STATIC_VARIANT_OBJECT),
            property,
            meta.parentPath
          );
        }

        return t.objectProperty(property.key, classNames[0] || t.stringLiteral(''));
      })
    )
  );

  // We store sheets in the meta state so that we can use it later to generate Compiled component.
  meta.state.cssMap[path.parent.id.name] = totalSheets;
};
